variable "fly_api_token" {
  description = "fly.io API token (set via FLY_API_TOKEN env var)"
  type        = string
  sensitive   = true
}

variable "app_name" {
  description = "fly.io app name (must be globally unique)"
  type        = string
  default     = "making-monsters"
}

variable "fly_org" {
  description = "fly.io organization slug"
  type        = string
}

variable "primary_region" {
  description = "Primary fly.io region for volume placement"
  type        = string
  default     = "ord"
}
