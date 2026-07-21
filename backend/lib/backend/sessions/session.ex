defmodule Backend.Sessions.Session do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "sessions" do
    field :scheduled_at, :utc_datetime
    field :status, :string, default: "pending"
    belongs_to :initiator, Backend.Accounts.User
    belongs_to :partner, Backend.Accounts.User
    belongs_to :topic, Backend.Content.Topic
    belongs_to :board_entry, Backend.Sessions.BoardEntry

    timestamps()
  end

  def changeset(session, attrs) do
    session
    |> cast(attrs, [:initiator_id, :partner_id, :topic_id, :board_entry_id, :scheduled_at, :status])
    |> validate_required([:initiator_id, :topic_id])
    |> validate_inclusion(:status, ["pending", "matched", "in_progress", "completed", "cancelled"])
  end
end
