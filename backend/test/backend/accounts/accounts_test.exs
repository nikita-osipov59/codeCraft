defmodule Backend.AccountsTest do
  use Backend.DataCase

  alias Backend.Accounts

  describe "users" do
    test "create_user/1 with valid data creates a user" do
      attrs = %{discord_id: "12345", username: "testuser", role: "both"}
      assert {:ok, %Backend.Accounts.User{} = user} = Accounts.create_user(attrs)
      assert user.discord_id == "12345"
      assert user.username == "testuser"
      assert user.role == "both"
    end

    test "create_user/1 with invalid role returns error" do
      attrs = %{discord_id: "12345", username: "testuser", role: "invalid"}
      assert {:error, %Ecto.Changeset{}} = Accounts.create_user(attrs)
    end

    test "get_user_by_discord_id/1 returns user" do
      {:ok, user} = Accounts.create_user(%{discord_id: "12345", username: "test", role: "interviewer"})
      assert Accounts.get_user_by_discord_id("12345").id == user.id
      assert Accounts.get_user_by_discord_id("nonexistent") == nil
    end

    test "update_user/2 updates role" do
      {:ok, user} = Accounts.create_user(%{discord_id: "1", username: "u", role: "both"})
      {:ok, updated} = Accounts.update_user(user, %{role: "interviewer"})
      assert updated.role == "interviewer"
    end
  end
end
