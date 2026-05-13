terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "5.19.1"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# Cloudflare D1 Database
resource "cloudflare_d1_database" "main" {
  account_id = var.cloudflare_account_id
  name       = var.database_name

  # Optional: Restrict database location for data sovereignty
  # Valid values: "eu", "fedramp"
  # jurisdiction = "eu"

  # Optional: Primary location hint for the database
  # Valid values: "wnam", "enam", "weur", "eeur", "apac", "oc"
  # primary_location_hint = "weur"
}
