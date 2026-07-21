defmodule Backend.Sessions.BoardEntry do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "board_entries" do
    field :looking_for, :string
    field :time_slot, :utc_datetime
    field :description, :string
    field :status, :string, default: "open"
    belongs_to :author, Backend.Accounts.User
    belongs_to :topic, Backend.Content.Topic

    timestamps()
  end

  def changeset(entry, attrs) do
    entry
    |> cast(attrs, [:author_id, :topic_id, :looking_for, :time_slot, :description, :status])
    |> validate_required([:author_id, :topic_id, :looking_for])
    |> validate_inclusion(:looking_for, ["interviewer", "interviewee"])
    |> validate_inclusion(:status, ["open", "matched", "closed"])
  end
end
