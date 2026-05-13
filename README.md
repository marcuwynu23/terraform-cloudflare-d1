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

The `result[].id` field in the JSON response is your Account ID.## Usage

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
