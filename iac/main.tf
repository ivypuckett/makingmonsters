terraform {
  required_providers {
    fly = {
      source  = "fly-apps/fly"
      version = "~> 0.0.23"
    }
  }
}

provider "fly" {
  fly_api_token = var.fly_api_token
}

resource "fly_app" "server" {
  name = var.app_name
  org  = var.fly_org
}

resource "fly_volume" "pb_data" {
  app    = fly_app.server.name
  name   = "pb_data"
  size   = 1
  region = var.primary_region
}

resource "fly_ip" "server_ipv4" {
  app  = fly_app.server.name
  type = "v4"
}

resource "fly_ip" "server_ipv6" {
  app  = fly_app.server.name
  type = "v6"
}
