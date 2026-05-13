
# Variables
variable "cloudflare_api_token" {
  description = "Cloudflare API Token with D1 permissions"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare Account ID"
  type        = string
}

variable "database_name" {
  description = "Name of the D1 database"
  type        = string
  default     = "my-database"
}

# Outputs
output "d1_database_id" {
  description = "UUID of the D1 database"
  value       = cloudflare_d1_database.main.id
}

output "d1_database_name" {
  description = "Name of the D1 database"
  value       = cloudflare_d1_database.main.name
}