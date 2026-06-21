# terraform-cloudflare-d1

This Terraform project provisions a Cloudflare D1 serverless SQL database using the official Cloudflare Terraform provider.

## Features

- Provisions a Cloudflare D1 database via Infrastructure as Code
- Configurable database name, jurisdiction, and primary location hint
- Sensitive API token handling through Terraform variables
- Outputs database ID and name for downstream use (e.g., Worker bindings)

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/downloads) `>= 1.0`
- A [Cloudflare account](https://dash.cloudflare.com/sign-up)
- A Cloudflare API Token with **D1 Edit** permissions
- Your Cloudflare **Account ID**

### How to get your Cloudflare API Token

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com/).
2. Go to **My Profile** → **API Tokens**, or open [this direct link](https://dash.cloudflare.com/profile/api-tokens).
3. Click **Create Token**.
4. Under **Custom token**, click **Get started**.
5. Give the token a descriptive name (e.g., `terraform-d1`).
6. Under **Permissions**, add:
   - `Account` → `D1` → `Edit`
7. Under **Account Resources**, select the account you want this token scoped to (e.g., `Include` → `<Your Account>`).
8. (Optional) Set **TTL** and **IP Address Filtering** as needed.
9. Click **Continue to summary** → **Create Token**.
10. Copy the generated token immediately and store it securely — it won't be shown again.

> Use a scoped API token (D1 Edit only) rather than your Global API Key for least-privilege access.

### How to get your Cloudflare Account ID

**Option A — From the dashboard URL**

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com/).
2. Select any domain/account from your home page.
3. Look at the URL — it will be in the form:
   `https://dash.cloudflare.com/<ACCOUNT_ID>/...`
4. Copy the `<ACCOUNT_ID>` segment.

**Option B — From the Account home page**

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com/).
2. Click **Workers & Pages** (or any domain overview).
3. On the right sidebar, find **Account ID** and click the copy icon.

**Option C — Via the API**

```bash
curl -X GET "https://api.cloudflare.com/client/v4/accounts" \
  -H "Authorization: Bearer <YOUR_API_TOKEN>" \
  -H "Content-Type: application/json"
```

The `result[].id` field in the JSON response is your Account ID.

## Usage

### 1. Clone and configure

```bash
git clone https://github.com/marcuwynu23/terraform-cloudflare-d1.git
cd terraform-cloudflare-d1
cp terraform.tfvars.example terraform.tfvars
```

### 2. Set your values in `terraform.tfvars`

```hcl
cloudflare_api_token  = "your-api-token-here"
cloudflare_account_id = "your-account-id-here"
database_name         = "my-database"
```

### 3. Initialize Terraform

```bash
terraform init
```

### 4. Preview changes

```bash
terraform plan
```

### 5. Apply

```bash
terraform apply
```

### 6. Destroy (when no longer needed)

```bash
terraform destroy
```

## Variables

| Name                    | Description                              | Type     | Default       | Required |
| ----------------------- | ---------------------------------------- | -------- | ------------- | :------: |
| `cloudflare_api_token`  | Cloudflare API Token with D1 permissions | `string` | n/a           |   yes    |
| `cloudflare_account_id` | Cloudflare Account ID                    | `string` | n/a           |   yes    |
| `database_name`         | Name of the D1 database                  | `string` | `my-database` |    no    |

## Outputs

| Name               | Description             |
| ------------------ | ----------------------- |
| `d1_database_id`   | UUID of the D1 database |
| `d1_database_name` | Name of the D1 database |

## Usage as a Module

Reference this repository as a Terraform module in your own configurations:

```hcl
module "d1_database" {
  source = "github.com/marcuwynu23/terraform-cloudflare-d1?ref=main"

  cloudflare_api_token  = var.cloudflare_api_token
  cloudflare_account_id = var.cloudflare_account_id
  database_name         = "my-database"
}
```

Then use the outputs in your configuration:

```hcl
# Example: bind the database to a Cloudflare Worker
resource "cloudflare_workers_script" "worker" {
  # ...
  d1_database_bindings {
    name    = "DB"
    id      = module.d1_database.d1_database_id
  }
}
```

All variables and outputs documented below are available when using this as a module.

## Optional Configuration

The `cloudflare_d1_database` resource supports two optional arguments (commented in `main.tf`):

- `jurisdiction` — restrict data location. Valid values: `eu`, `fedramp`
- `primary_location_hint` — preferred region. Valid values: `wnam`, `enam`, `weur`, `eeur`, `apac`, `oc`

Uncomment and set them in `main.tf` as needed.

## Binding D1 to a Worker

After applying, use the output `d1_database_id` in your `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "my-database"
database_id = "<d1_database_id from terraform output>"
```

## Testing with the `examples/` folder

The [`examples/`](./examples) folder contains a Node.js script (`index.js`) that verifies the provisioned D1 database by running full CRUD operations through the Cloudflare REST API using the built-in `fetch`. Environment variables are loaded from `examples/.env` via [`dotenv`](https://www.npmjs.com/package/dotenv).

### Requirements

- Node.js `>= 18` (for native `fetch`)

### 1. Get the D1 database ID from Terraform

After `terraform apply`, capture the database UUID:

```bash
terraform output d1_database_id
```

### 2. Configure environment variables

```bash
cd examples
cp .env.example .env
```

Edit `examples/.env` and fill in the values:

```dotenv
CLOUDFLARE_API_TOKEN=your-api-token-here
CLOUDFLARE_ACCOUNT_ID=your-account-id-here
CLOUDFLARE_D1_DATABASE_ID=your-d1-database-id-here
```

> `examples/.env` is gitignored — `.env.example` is committed as a template.

### 3. Install dependencies and run

```bash
cd examples
npm install
node index.js
```

Or using the npm script:

```bash
npm start
```

### What the script does

1. Creates a `users` table if it does not exist
2. Inserts a demo user
3. Fetches the user by id
4. Updates the user
5. Lists all users
6. Deletes the demo user

Expected output (abbreviated):

```
→ Creating table 'users' if not exists...
→ Creating user: Alice <demo+...@example.com>
Created: { id: 1, name: 'Alice', ... }
→ Fetching user id=1
Fetched: { id: 1, ... }
→ Updating user id=1
Updated: { id: 1, name: 'Alice Updated', ... }
→ Listing users
All users: [ { ... } ]
→ Deleting user id=1
Deleted rows: 1
```

## Security Notes

- `terraform.tfvars` and `*.tfstate` files are gitignored — never commit secrets
- The API token variable is marked `sensitive` to prevent accidental log exposure
- Use a scoped API token (D1 Edit only) rather than a Global API Key

## References

- [Cloudflare D1 documentation](https://developers.cloudflare.com/d1/)
- [Cloudflare Terraform provider](https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs)
- [cloudflare_d1_database resource](https://developers.cloudflare.com/api/terraform/resources/d1/subresources/database/)

## License

MIT
