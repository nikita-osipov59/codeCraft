defmodule Backend.Repo.Migrations.CreateBoardEntries do
  use Ecto.Migration

  def change do
    create table(:board_entries, primary_key: false) do
      add :id, :uuid, primary_key: true
      add :author_id, references(:users, type: :uuid, on_delete: :delete_all), null: false
      add :topic_id, references(:topics, type: :uuid, on_delete: :delete_all), null: false
      add :looking_for, :string, null: false
      add :time_slot, :utc_datetime
      add :description, :text
      add :status, :string, default: "open"

      timestamps()
    end

    create index(:board_entries, [:author_id])
    create index(:board_entries, [:topic_id])
    create index(:board_entries, [:status])
  end
end
