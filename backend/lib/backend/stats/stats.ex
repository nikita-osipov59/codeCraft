defmodule Backend.Stats do
  import Ecto.Query, warn: false
  alias Backend.Repo
  alias Backend.Sessions.{Session, Feedback}

  def user_stats(user_id) do
    sessions = Repo.all(
      from s in Session,
      where: (s.initiator_id == ^user_id or s.partner_id == ^user_id) and s.status == "completed",
      preload: [:topic]
    )

    feedback_given = Repo.one(from f in Feedback, where: f.reviewer_id == ^user_id, select: count(f.id))
    feedback_received = Repo.one(
      from f in Feedback,
      join: s in Session, on: f.session_id == s.id,
      where: (s.initiator_id == ^user_id or s.partner_id == ^user_id) and f.reviewer_id != ^user_id,
      select: count(f.id)
    )
    avg_rating = Repo.one(
      from f in Feedback,
      join: s in Session, on: f.session_id == s.id,
      where: (s.initiator_id == ^user_id or s.partner_id == ^user_id) and f.reviewer_id != ^user_id,
      select: avg(f.rating)
    )

    topics = sessions |> Enum.map(& &1.topic.name) |> Enum.uniq()
    by_role = sessions |> Enum.group_by(fn s ->
      cond do
        s.initiator_id == user_id -> "initiator"
        true -> "partner"
      end
    end)

    %{
      total_sessions: length(sessions),
      feedback_given: feedback_given || 0,
      feedback_received: feedback_received || 0,
      avg_rating: avg_rating || 0.0,
      topics_covered: topics,
      as_initiator: length(Map.get(by_role, "initiator", [])),
      as_partner: length(Map.get(by_role, "partner", []))
    }
  end
end
