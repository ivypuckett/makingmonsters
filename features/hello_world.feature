Feature: Server health check
  As a developer
  I want to verify the server is running
  So I can be confident the backend is available

  Scenario: Server responds to health check
    Given the server is running on port 8090
    When I request the health endpoint
    Then the response status should be 200
    And the response body should indicate the server is healthy
