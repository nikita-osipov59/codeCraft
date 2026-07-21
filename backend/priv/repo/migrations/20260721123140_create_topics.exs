defmodule Backend.Repo.Migrations.CreateTopics do
  use Ecto.Migration

  def change do
    create table(:topics, primary_key: false) do
      add :id, :uuid, primary_key: true
      add :name, :string, null: false
      add :category, :string, null: false
      add :icon, :string
      add :description, :text

      timestamps()
    end

    create unique_index(:topics, [:name])
  end
end
