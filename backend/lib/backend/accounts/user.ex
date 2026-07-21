defmodule Backend.Accounts.User do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "users" do
    field :discord_id, :string
    field :username, :string
    field :avatar, :string
    field :role, :string, default: "both"
    field :rating, :float, default: 0.0
    field :sessions_count, :integer, default: 0

    timestamps()
  end

  def changeset(user, attrs) do
    user
    |> cast(attrs, [:discord_id, :username, :avatar, :role])
    |> validate_required([:discord_id, :username, :role])
    |> validate_inclusion(:role, ["interviewer", "interviewee", "both"])
    |> unique_constraint(:discord_id)
  end
end
