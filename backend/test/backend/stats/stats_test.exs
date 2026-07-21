defmodule Backend.StatsTest do
  use Backend.DataCase

  alias Backend.Accounts
  alias Backend.Content
  alias Backend.Sessions
  alias Backend.Stats

  test "user_stats/1 returns stats" do
    {:ok, u1} = Accounts.create_user(%{discord_id: "1", username: "a", role: "interviewer"})
    {:ok, t} = Content.create_topic(%{name: "SQL", category: "SQL"})
    {:ok, s1} = Sessions.create_session(%{initiator_id: u1.id, topic_id: t.id, status: "completed"})
    Sessions.create_feedback(%{reviewer_id: u1.id, session_id: s1.id, rating: 5})

    stats = Stats.user_stats(u1.id)
    assert stats.total_sessions == 1
    assert stats.feedback_given >= 1
    assert stats.topics_covered == ["SQL"]
  end
end
