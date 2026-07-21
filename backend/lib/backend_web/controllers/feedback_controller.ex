defmodule BackendWeb.FeedbackController do
  use BackendWeb, :controller
  action_fallback BackendWeb.FallbackController

  def create(conn, %{"feedback" => feedback_params}) do
    current_user = conn.assigns.current_user
    params = Map.put(feedback_params, "reviewer_id", current_user.id)
    {:ok, feedback} = Backend.Sessions.create_feedback(params)
    json(conn, %{id: feedback.id, rating: feedback.rating, comment: feedback.comment, reviewer_id: feedback.reviewer_id})
  end
end
