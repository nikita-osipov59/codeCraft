defmodule Backend.Content.Question do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "questions" do
    field :level, :string
    field :text, :string
    field :tags, {:array, :string}, default: []
    belongs_to :topic, Backend.Content.Topic
    belongs_to :author, Backend.Accounts.User

    timestamps()
  end

  def changeset(question, attrs) do
    question
    |> cast(attrs, [:topic_id, :level, :text, :tags, :author_id])
    |> validate_required([:topic_id, :level, :text])
    |> validate_inclusion(:level, ["junior", "middle", "senior"])
    |> foreign_key_constraint(:topic_id)
  end
end
