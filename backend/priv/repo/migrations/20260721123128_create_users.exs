defmodule Backend.Repo.Migrations.CreateUsers do
  use Ecto.Migration

  def change do
    create table(:users, primary_key: false) do
      add :id, :uuid, primary_key: true
      add :discord_id, :string, null: false
      add :username, :string, null: false
      add :avatar, :string
      add :role, :string, null: false, default: "both"
      add :rating, :float, default: 0.0
      add :sessions_count, :integer, default: 0

      timestamps()
    end

    create unique_index(:users, [:discord_id])
  end
end
