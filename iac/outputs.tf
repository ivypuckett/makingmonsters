output "app_name" {
  description = "fly.io app name"
  value       = fly_app.server.name
}

output "app_url" {
  description = "Public HTTPS URL for the deployed app"
  value       = "https://${fly_app.server.name}.fly.dev"
}

output "ipv4_address" {
  description = "Dedicated IPv4 address"
  value       = fly_ip.server_ipv4.address
}

output "ipv6_address" {
  description = "Dedicated IPv6 address"
  value       = fly_ip.server_ipv6.address
}
