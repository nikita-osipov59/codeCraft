defmodule BackendWeb.QuestionController do
  use BackendWeb, :controller
  action_fallback BackendWeb.FallbackController

  def index(conn, %{"topic_id" => topic_id}) do
    questions = Backend.Content.list_questions(topic_id)
    json(conn, Enum.map(questions, fn q ->
      %{id: q.id, topic_id: q.topic_id, level: q.level, text: q.text, tags: q.tags}
    end))
  end

  def create(conn, %{"question" => question_params}) do
    {:ok, question} = Backend.Content.create_question(question_params)
    json(conn, %{id: question.id, topic_id: question.topic_id, level: question.level, text: question.text, tags: question.tags})
  end

  def delete(conn, %{"id" => id}) do
    question = Backend.Content.get_question!(id)
    {:ok, _} = Backend.Content.delete_question(question)
    send_resp(conn, :no_content, "")
  end
end
