defmodule Backend.Content.Topic do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "topics" do
    field :name, :string
    field :category, :string
    field :icon, :string
    field :description, :string

    timestamps()
  end

  def changeset(topic, attrs) do
    topic
    |> cast(attrs, [:name, :category, :icon, :description])
    |> validate_required([:name, :category])
    |> unique_constraint(:name)
  end
end
