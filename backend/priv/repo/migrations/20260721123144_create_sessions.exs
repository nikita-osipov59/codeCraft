defmodule Backend.Repo.Migrations.CreateSessions do
  use Ecto.Migration

  def change do
    create table(:sessions, primary_key: false) do
      add :id, :uuid, primary_key: true
      add :initiator_id, references(:users, type: :uuid, on_delete: :nilify_all), null: false
      add :partner_id, references(:users, type: :uuid, on_delete: :nilify_all)
      add :topic_id, references(:topics, type: :uuid, on_delete: :nilify_all), null: false
      add :board_entry_id, references(:board_entries, type: :uuid, on_delete: :nilify_all)
      add :scheduled_at, :utc_datetime
      add :status, :string, default: "pending"

      timestamps()
    end

    create index(:sessions, [:initiator_id])
    create index(:sessions, [:partner_id])
    create index(:sessions, [:status])
  end
end
