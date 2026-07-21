defmodule Backend.Sessions.Feedback do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "feedback" do
    field :rating, :integer
    field :comment, :string
    belongs_to :reviewer, Backend.Accounts.User
    belongs_to :session, Backend.Sessions.Session

    timestamps()
  end

  def changeset(feedback, attrs) do
    feedback
    |> cast(attrs, [:reviewer_id, :session_id, :rating, :comment])
    |> validate_required([:reviewer_id, :session_id, :rating])
    |> validate_inclusion(:rating, 1..5)
  end
end
