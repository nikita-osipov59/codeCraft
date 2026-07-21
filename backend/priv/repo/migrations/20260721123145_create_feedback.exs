defmodule Backend.Repo.Migrations.CreateFeedback do
  use Ecto.Migration

  def change do
    create table(:feedback, primary_key: false) do
      add :id, :uuid, primary_key: true
      add :reviewer_id, references(:users, type: :uuid, on_delete: :nilify_all), null: false
      add :session_id, references(:sessions, type: :uuid, on_delete: :delete_all), null: false
      add :rating, :integer, null: false
      add :comment, :text

      timestamps()
    end

    create index(:feedback, [:session_id])
    create index(:feedback, [:reviewer_id])
  end
end
