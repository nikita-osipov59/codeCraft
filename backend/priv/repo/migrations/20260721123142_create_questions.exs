defmodule Backend.Repo.Migrations.CreateQuestions do
  use Ecto.Migration

  def change do
    create table(:questions, primary_key: false) do
      add :id, :uuid, primary_key: true
      add :topic_id, references(:topics, type: :uuid, on_delete: :delete_all), null: false
      add :level, :string, null: false
      add :text, :text, null: false
      add :tags, {:array, :string}, default: []
      add :author_id, references(:users, type: :uuid, on_delete: :nilify_all)

      timestamps()
    end

    create index(:questions, [:topic_id])
  end
end
