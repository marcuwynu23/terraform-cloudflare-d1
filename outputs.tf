# Outputs
output "d1_database_id" {
  description = "UUID of the D1 database"
  value       = cloudflare_d1_database.main.id
}

output "d1_database_name" {
  description = "Name of the D1 database"
  value       = cloudflare_d1_database.main.name
}
