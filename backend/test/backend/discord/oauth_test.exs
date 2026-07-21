defmodule Backend.Discord.OAuthTest do
  use Backend.DataCase

  describe "authorize_url/1" do
    test "returns a valid Discord OAuth URL" do
      Application.put_env(:backend, :discord_client_id, "test_client_id")
      url = Backend.Discord.OAuth.authorize_url("http://localhost:4000/auth/discord/callback")
      assert String.contains?(url, "discord.com/api/oauth2/authorize")
      assert String.contains?(url, "client_id=test_client_id")
      assert String.contains?(url, "scope=identify")
    end
  end
end
