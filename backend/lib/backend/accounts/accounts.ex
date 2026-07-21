defmodule Backend.Accounts do
  import Ecto.Query, warn: false
  alias Backend.Repo
  alias Backend.Accounts.User

  def get_user!(id), do: Repo.get!(User, id)

  def get_user_by_discord_id(discord_id) do
    Repo.get_by(User, discord_id: discord_id)
  end

  def create_user(attrs \\ %{}) do
    %User{}
    |> User.changeset(attrs)
    |> Repo.insert()
  end

  def update_user(%User{} = user, attrs) do
    user
    |> User.changeset(attrs)
    |> Repo.update()
  end

  def delete_user(%User{} = user) do
    Repo.delete(user)
  end
end
