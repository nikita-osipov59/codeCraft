defmodule BackendWeb.Router do
  use BackendWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
  end

  pipeline :auth do
    plug BackendWeb.Plugs.Auth
  end

  scope "/auth", BackendWeb do
    pipe_through :api
    get "/discord", AuthController, :authorize
    get "/discord/callback", AuthController, :callback
  end

  scope "/api", BackendWeb do
    pipe_through [:api, :auth]

    get "/users/me", UserController, :me
    patch "/users/role", UserController, :update_role
    get "/users/:id", UserController, :show

    get "/topics", TopicController, :index
    get "/topics/:id", TopicController, :show
    post "/topics", TopicController, :create
    delete "/topics/:id", TopicController, :delete

    get "/questions", QuestionController, :index
    post "/questions", QuestionController, :create
    delete "/questions/:id", QuestionController, :delete

    get "/board", BoardController, :index
    post "/board", BoardController, :create
    post "/board/:id/apply", BoardController, :apply
    delete "/board/:id", BoardController, :delete

    get "/sessions", SessionController, :index
    post "/sessions", SessionController, :create
    get "/sessions/:id", SessionController, :show
    patch "/sessions/:id/status", SessionController, :update_status
    delete "/sessions/:id", SessionController, :delete

    post "/sessions/:id/feedback", FeedbackController, :create

    get "/stats/me", StatsController, :me
  end
end
