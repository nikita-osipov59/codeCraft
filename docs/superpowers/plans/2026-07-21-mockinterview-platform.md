# MockInterview Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) for syntax tracking.

**Goal:** Build a mock interview preparation platform with Discord OAuth auth, board for finding partners, session tracking, feedback, and Discord webhook notifications.

**Architecture:** Phoenix (Elixir) REST API backend with Next.js (TypeScript) frontend. PostgreSQL for persistence. Discord OAuth for authentication. Webhooks for Discord notifications.

**Tech Stack:** Phoenix 1.7+, Elixir 1.15+, PostgreSQL 15+, Next.js 14+, TypeScript 5+, Tailwind CSS 3+

## Global Constraints

- No comments in code unless absolutely necessary for understanding
- All API responses in JSON
- Phoenix API mount at `/api`
- Discord OAuth scope: `identify` only
- Webhook events: new board entry, match, session status change, session completed
- All timestamps in ISO 8601

---

### Task 1: Phoenix Project Scaffolding

**Files:**
- Create: `backend/` (full Phoenix project)

- [ ] **Step 1: Generate Phoenix project**

```bash
mix phx.new backend --database postgres --no-html --no-assets --no-live-reload --no-mailer
cd backend
```

- [ ] **Step 2: Add dependencies to mix.exs**

```elixir
# In mix.exs deps, add:
{:req, "~> 0.4"},
{:corsica, "~> 2.0"},
{:jason, "~> 1.4"},
{:oauther, "~> 1.2"}
```

- [ ] **Step 3: Run `mix deps.get`**

```bash
mix deps.get
```

- [ ] **Step 4: Configure CORS in endpoint.ex**

```elixir
# In lib/mock_interview_web/endpoint.ex, before `plug Plug.Parsers`:
plug CORSica,
  origins: ["http://localhost:3000"],
  allow_headers: ["content-type", "authorization"],
  allow_methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"]
```

- [ ] **Step 5: Configure CORS for Phoenix router**

```elixir
# In lib/mock_interview_web/router.ex, add:
pipeline :api do
  plug :accepts, ["json"]
  plug CORSica, origins: ["http://localhost:3000"], allow_headers: ["content-type", "authorization"], allow_methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"]
end
```

- [ ] **Step 6: Create database**

```bash
mix ecto.create
```

- [ ] **Step 7: Configure dev.exs for PostgreSQL**

```elixir
# config/dev.exs, ensure database is set
config :backend, Backend.Repo,
  username: "postgres",
  password: "postgres",
  hostname: "localhost",
  database: "mock_interview_dev",
  pool_size: 10
```

- [ ] **Step 8: Test server starts**

```bash
mix phx.server
# Visit http://localhost:4000/api/health (will fail but server should respond)
```

- [ ] **Step 9: Commit**

```bash
git add backend/
git commit -m "feat: scaffold Phoenix backend"
```

---

### Task 2: Database Migrations

**Files:**
- Create: `backend/priv/repo/migrations/001_create_users.exs`
- Create: `backend/priv/repo/migrations/002_create_topics.exs`
- Create: `backend/priv/repo/migrations/003_create_questions.exs`
- Create: `backend/priv/repo/migrations/004_create_board_entries.exs`
- Create: `backend/priv/repo/migrations/005_create_sessions.exs`
- Create: `backend/priv/repo/migrations/006_create_feedback.exs`

- [ ] **Step 1: Create users migration**

```elixir
# priv/repo/migrations/001_create_users.exs
defmodule Backend.Repo.Migrations.CreateUsers do
  use Ecto.Migration

  def change do
    create table(:users, primary_key: false) do
      add :id, :uuid, primary_key: true
      add :discord_id, :string, null: false
      add :username, :string, null: false
      add :avatar, :string
      add :role, :string, null: false, default: "both"
      add :rating, :float, default: 0.0
      add :sessions_count, :integer, default: 0

      timestamps()
    end

    create unique_index(:users, [:discord_id])
  end
end
```

- [ ] **Step 2: Create topics migration**

```elixir
# priv/repo/migrations/002_create_topics.exs
defmodule Backend.Repo.Migrations.CreateTopics do
  use Ecto.Migration

  def change do
    create table(:topics, primary_key: false) do
      add :id, :uuid, primary_key: true
      add :name, :string, null: false
      add :category, :string, null: false
      add :icon, :string
      add :description, :text

      timestamps()
    end

    create unique_index(:topics, [:name])
  end
end
```

- [ ] **Step 3: Create questions migration**

```elixir
# priv/repo/migrations/003_create_questions.exs
defmodule Backend.Repo.Migrations.CreateQuestions do
  use Ecto.Migration

  def change do
    create table(:questions, primary_key: false) do
      add :id, :uuid, primary_key: true
      add :topic_id, references(:topics, type: :uuid, on_delete: :delete_all), null: false
      add :level, :string, null: false
      add :text, :text, null: false
      add :tags, {:array, :string}, default: []
      add :author_id, references(:users, type: :uuid, on_delete: :nilify_all)

      timestamps()
    end

    create index(:questions, [:topic_id])
  end
end
```

- [ ] **Step 4: Create board_entries migration**

```elixir
# priv/repo/migrations/004_create_board_entries.exs
defmodule Backend.Repo.Migrations.CreateBoardEntries do
  use Ecto.Migration

  def change do
    create table(:board_entries, primary_key: false) do
      add :id, :uuid, primary_key: true
      add :author_id, references(:users, type: :uuid, on_delete: :delete_all), null: false
      add :topic_id, references(:topics, type: :uuid, on_delete: :delete_all), null: false
      add :looking_for, :string, null: false
      add :time_slot, :utc_datetime
      add :description, :text
      add :status, :string, default: "open"

      timestamps()
    end

    create index(:board_entries, [:author_id])
    create index(:board_entries, [:topic_id])
    create index(:board_entries, [:status])
  end
end
```

- [ ] **Step 5: Create sessions migration**

```elixir
# priv/repo/migrations/005_create_sessions.exs
defmodule Backend.Repo.Migrations.CreateSessions do
  use Ecto.Migration

  def change do
    create table(:sessions, primary_key: false) do
      add :id, :uuid, primary_key: true
      add :initiator_id, references(:users, type: :uuid, on_delete: :nilify_all), null: false
      add :partner_id, references(:users, type: :uuid, on_delete: :nilify_all)
      add :topic_id, references(:topics, type: :uuid, on_delete: :nilify_all), null: false
      add :board_entry_id, references(:board_entries, type: :uuid, on_delete: :nilify_all)
      add :scheduled_at, :utc_datetime
      add :status, :string, default: "pending"

      timestamps()
    end

    create index(:sessions, [:initiator_id])
    create index(:sessions, [:partner_id])
    create index(:sessions, [:status])
  end
end
```

- [ ] **Step 6: Create feedback migration**

```elixir
# priv/repo/migrations/006_create_feedback.exs
defmodule Backend.Repo.Migrations.CreateFeedback do
  use Ecto.Migration

  def change do
    create table(:feedback, primary_key: false) do
      add :id, :uuid, primary_key: true
      add :reviewer_id, references(:users, type: :uuid, on_delete: :nilify_all), null: false
      add :session_id, references(:sessions, type: :uuid, on_delete: :delete_all), null: false
      add :rating, :integer, null: false
      add :comment, :text

      timestamps()
    end

    create index(:feedback, [:session_id])
    create index(:feedback, [:reviewer_id])
  end
end
```

- [ ] **Step 7: Run migrations**

```bash
mix ecto.migrate
```

- [ ] **Step 8: Commit**

```bash
git add backend/priv/repo/migrations/
git commit -m "feat: add database migrations"
```

---

### Task 3: Account Context (User Schema + Accounts Context)

**Files:**
- Create: `backend/lib/mock_interview/accounts/user.ex`
- Create: `backend/lib/mock_interview/accounts/accounts.ex`
- Modify: `backend/lib/mock_interview.ex`

- [ ] **Step 1: Create User schema**

```elixir
# lib/mock_interview/accounts/user.ex
defmodule Backend.Accounts.User do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "users" do
    field :discord_id, :string
    field :username, :string
    field :avatar, :string
    field :role, :string, default: "both"
    field :rating, :float, default: 0.0
    field :sessions_count, :integer, default: 0

    timestamps()
  end

  def changeset(user, attrs) do
    user
    |> cast(attrs, [:discord_id, :username, :avatar, :role])
    |> validate_required([:discord_id, :username, :role])
    |> validate_inclusion(:role, ["interviewer", "interviewee", "both"])
    |> unique_constraint(:discord_id)
  end
end
```

- [ ] **Step 2: Create Accounts context**

```elixir
# lib/mock_interview/accounts/accounts.ex
defmodule Backend.Accounts do
  import Ecto.Query, warn: false
  alias Backend.Repo
  alias Backend.Accounts.User

  def list_users do
    Repo.all(User)
  end

  def get_user!(id), do: Repo.get!(User, id)

  def get_user_by_discord_id(discord_id) do
    Repo.get_by(User, discord_id: discord_id)
  end

  def create_user(attrs \\ %{}) do
    %User{}
    |> User.changeset(attrs)
    |> Repo.insert()
  end

  def update_user(%User{} = user, attrs) do
    user
    |> User.changeset(attrs)
    |> Repo.update()
  end

  def delete_user(%User{} = user) do
    Repo.delete(user)
  end
end
```

- [ ] **Step 3: Add accounts to MockInterview module**

```elixir
# In lib/mock_interview.ex, add to the top-level module
defmodule Backend do
  alias Backend.Accounts
  # ... rest stays
end
```

- [ ] **Step 4: Write and run tests**

```elixir
# test/mock_interview/accounts/accounts_test.exs
defmodule Backend.AccountsTest do
  use Backend.DataCase

  alias Backend.Accounts

  describe "users" do
    test "create_user/1 with valid data creates a user" do
      attrs = %{discord_id: "12345", username: "testuser", role: "both"}
      assert {:ok, %Backend.Accounts.User{} = user} = Accounts.create_user(attrs)
      assert user.discord_id == "12345"
      assert user.username == "testuser"
      assert user.role == "both"
    end

    test "create_user/1 with invalid role returns error" do
      attrs = %{discord_id: "12345", username: "testuser", role: "invalid"}
      assert {:error, %Ecto.Changeset{}} = Accounts.create_user(attrs)
    end

    test "get_user_by_discord_id/1 returns user" do
      {:ok, user} = Accounts.create_user(%{discord_id: "12345", username: "test", role: "interviewer"})
      assert Accounts.get_user_by_discord_id("12345").id == user.id
      assert Accounts.get_user_by_discord_id("nonexistent") == nil
    end
  end
end
```

```bash
mix test test/mock_interview/accounts/accounts_test.exs
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/lib/mock_interview/accounts/ backend/test/
git commit -m "feat: add Account context with User schema"
```

---

### Task 4: Content Context (Topics + Questions)

**Files:**
- Create: `backend/lib/mock_interview/content/topic.ex`
- Create: `backend/lib/mock_interview/content/question.ex`
- Create: `backend/lib/mock_interview/content/content.ex`

- [ ] **Step 1: Create Topic schema**

```elixir
# lib/mock_interview/content/topic.ex
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
```

- [ ] **Step 2: Create Question schema**

```elixir
# lib/mock_interview/content/question.ex
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
```

- [ ] **Step 3: Create Content context**

```elixir
# lib/mock_interview/content/content.ex
defmodule Backend.Content do
  import Ecto.Query, warn: false
  alias Backend.Repo
  alias Backend.Content.{Topic, Question}

  # Topics

  def list_topics do
    Repo.all(Topic)
  end

  def get_topic!(id), do: Repo.get!(Topic, id)

  def create_topic(attrs \\ %{}) do
    %Topic{}
    |> Topic.changeset(attrs)
    |> Repo.insert()
  end

  def delete_topic(%Topic{} = topic) do
    Repo.delete(topic)
  end

  # Questions

  def list_questions(topic_id) do
    Repo.all(from q in Question, where: q.topic_id == ^topic_id, order_by: q.level)
  end

  def get_question!(id), do: Repo.get!(Question, id)

  def create_question(attrs \\ %{}) do
    %Question{}
    |> Question.changeset(attrs)
    |> Repo.insert()
  end

  def delete_question(%Question{} = question) do
    Repo.delete(question)
  end
end
```

- [ ] **Step 4: Write and run tests**

```elixir
# test/mock_interview/content/content_test.exs
defmodule Backend.ContentTest do
  use Backend.DataCase

  alias Backend.Content

  test "create_topic/1 with valid data creates a topic" do
    attrs = %{name: "Arrays & Hashing", category: "Algorithms", description: "Array manipulation and hash map problems"}
    assert {:ok, %Backend.Content.Topic{} = topic} = Content.create_topic(attrs)
    assert topic.name == "Arrays & Hashing"
  end

  test "list_topics/0 returns all topics" do
    Content.create_topic(%{name: "Trees", category: "Algorithms"})
    Content.create_topic(%{name: "System Design", category: "System Design"})
    assert length(Content.list_topics()) == 2
  end

  test "create_question/1 with valid data creates question" do
    {:ok, topic} = Content.create_topic(%{name: "Test", category: "Test"})
    attrs = %{topic_id: topic.id, level: "middle", text: "What is a hash map?"}
    assert {:ok, %Backend.Content.Question{} = q} = Content.create_question(attrs)
    assert q.text == "What is a hash map?"
    assert q.level == "middle"
  end

  test "list_questions/1 returns questions for topic" do
    {:ok, topic} = Content.create_topic(%{name: "Test", category: "Test"})
    Content.create_question(%{topic_id: topic.id, level: "junior", text: "Q1"})
    Content.create_question(%{topic_id: topic.id, level: "senior", text: "Q2"})
    assert length(Content.list_questions(topic.id)) == 2
  end
end
```

```bash
mix test test/mock_interview/content/content_test.exs
```

- [ ] **Step 5: Commit**

```bash
git add backend/lib/mock_interview/content/ backend/test/mock_interview/content/
git commit -m "feat: add Content context with Topic and Question schemas"
```

---

### Task 5: Sessions Context (Board, Sessions, Feedback)

**Files:**
- Create: `backend/lib/mock_interview/sessions/board_entry.ex`
- Create: `backend/lib/mock_interview/sessions/session.ex`
- Create: `backend/lib/mock_interview/sessions/feedback.ex`
- Create: `backend/lib/mock_interview/sessions/sessions.ex`

- [ ] **Step 1: Create BoardEntry schema**

```elixir
# lib/mock_interview/sessions/board_entry.ex
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
```

- [ ] **Step 2: Create Session schema**

```elixir
# lib/mock_interview/sessions/session.ex
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
```

- [ ] **Step 3: Create Feedback schema**

```elixir
# lib/mock_interview/sessions/feedback.ex
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
```

- [ ] **Step 4: Create Sessions context**

```elixir
# lib/mock_interview/sessions/sessions.ex
defmodule Backend.Sessions do
  import Ecto.Query, warn: false
  alias Backend.Repo
  alias Backend.Sessions.{BoardEntry, Session, Feedback}
  alias Backend.Accounts.User

  # Board Entries

  def list_open_entries do
    Repo.all(
      from e in BoardEntry,
      where: e.status == "open",
      preload: [:author, :topic],
      order_by: [desc: e.inserted_at]
    )
  end

  def get_board_entry!(id), do: Repo.get!(BoardEntry, id)

  def create_board_entry(attrs \\ %{}) do
    %BoardEntry{}
    |> BoardEntry.changeset(attrs)
    |> Repo.insert()
  end

  def close_board_entry(%BoardEntry{} = entry) do
    entry
    |> BoardEntry.changeset(%{status: "closed"})
    |> Repo.update()
  end

  def delete_board_entry(%BoardEntry{} = entry) do
    Repo.delete(entry)
  end

  # Sessions

  def list_user_sessions(user_id) do
    Repo.all(
      from s in Session,
      where: s.initiator_id == ^user_id or s.partner_id == ^user_id,
      preload: [:initiator, :partner, :topic],
      order_by: [desc: s.inserted_at]
    )
  end

  def get_session!(id), do: Repo.get!(Session, id) |> Repo.preload([:initiator, :partner, :topic, :board_entry])

  def create_session(attrs \\ %{}) do
    %Session{}
    |> Session.changeset(attrs)
    |> Repo.insert()
  end

  def update_session_status(%Session{} = session, status) do
    session
    |> Session.changeset(%{status: status})
    |> Repo.update()
  end

  def delete_session(%Session{} = session) do
    Repo.delete(session)
  end

  # Feedback

  def list_session_feedback(session_id) do
    Repo.all(from f in Feedback, where: f.session_id == ^session_id, preload: [:reviewer])
  end

  def create_feedback(attrs \\ %{}) do
    %Feedback{}
    |> Feedback.changeset(attrs)
    |> Repo.insert()
  end
end
```

- [ ] **Step 5: Write tests**

```elixir
# test/mock_interview/sessions/sessions_test.exs
defmodule Backend.SessionsTest do
  use Backend.DataCase

  alias Backend.Accounts
  alias Backend.Content
  alias Backend.Sessions

  setup do
    {:ok, user} = Accounts.create_user(%{discord_id: "1", username: "alice", role: "interviewer"})
    {:ok, topic} = Content.create_topic(%{name: "DP", category: "Algorithms"})
    %{user: user, topic: topic}
  end

  test "create_board_entry/1 with valid data", %{user: user, topic: topic} do
    attrs = %{author_id: user.id, topic_id: topic.id, looking_for: "interviewee"}
    assert {:ok, %Backend.Sessions.BoardEntry{} = entry} = Sessions.create_board_entry(attrs)
  end

  test "list_open_entries/0", %{user: user, topic: topic} do
    Sessions.create_board_entry(%{author_id: user.id, topic_id: topic.id, looking_for: "interviewee"})
    assert length(Sessions.list_open_entries()) == 1
  end

  test "create and get session", %{user: user, topic: topic} do
    {:ok, session} = Sessions.create_session(%{initiator_id: user.id, topic_id: topic.id, status: "pending"})
    fetched = Sessions.get_session!(session.id)
    assert fetched.status == "pending"
  end

  test "create_feedback/1", %{user: user, topic: topic} do
    {:ok, session} = Sessions.create_session(%{initiator_id: user.id, topic_id: topic.id})
    attrs = %{reviewer_id: user.id, session_id: session.id, rating: 4, comment: "good session"}
    assert {:ok, %Backend.Sessions.Feedback{} = fb} = Sessions.create_feedback(attrs)
    assert fb.rating == 4
  end
end
```

```bash
mix test test/mock_interview/sessions/sessions_test.exs
```

- [ ] **Step 6: Commit**

```bash
git add backend/lib/mock_interview/sessions/ backend/test/mock_interview/sessions/
git commit -m "feat: add Sessions context with BoardEntry, Session, Feedback"
```

---

### Task 6: Stats Context

**Files:**
- Create: `backend/lib/mock_interview/stats/stats.ex`

- [ ] **Step 1: Create Stats context**

```elixir
# lib/mock_interview/stats/stats.ex
defmodule Backend.Stats do
  import Ecto.Query, warn: false
  alias Backend.Repo
  alias Backend.Sessions.{Session, Feedback}
  alias Backend.Accounts.User

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
      where: s.initiator_id == ^user_id or s.partner_id == ^user_id,
      where: f.reviewer_id != ^user_id,
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
      feedback_given: feedback_given,
      feedback_received: feedback_received,
      avg_rating: avg_rating || 0.0,
      topics_covered: topics,
      as_initiator: length(Map.get(by_role, "initiator", [])),
      as_partner: length(Map.get(by_role, "partner", []))
    }
  end
end
```

- [ ] **Step 2: Write and run tests**

```elixir
# test/mock_interview/stats/stats_test.exs
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
    assert stats.feedback_given == 1
  end
end
```

```bash
mix test test/mock_interview/stats/stats_test.exs
```

- [ ] **Step 3: Commit**

```bash
git add backend/lib/mock_interview/stats/ backend/test/mock_interview/stats/
git commit -m "feat: add Stats context"
```

---

### Task 7: Discord OAuth Module

**Files:**
- Create: `backend/lib/mock_interview/discord/oauth.ex`

- [ ] **Step 1: Create OAuth module**

```elixir
# lib/mock_interview/discord/oauth.ex
defmodule Backend.Discord.OAuth do
  @discord_authorize_url "https://discord.com/api/oauth2/authorize"
  @discord_token_url "https://discord.com/api/oauth2/token"
  @discord_user_url "https://discord.com/api/users/@me"

  def authorize_url(redirect_uri) do
    client_id = Application.get_env(:backend, :discord_client_id)
    "#{@discord_authorize_url}?client_id=#{client_id}&redirect_uri=#{URI.encode(redirect_uri)}&response_type=code&scope=identify"
  end

  def get_token(code, redirect_uri) do
    client_id = Application.get_env(:backend, :discord_client_id)
    client_secret = Application.get_env(:backend, :discord_client_secret)

    body = %{
      client_id: client_id,
      client_secret: client_secret,
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirect_uri
    }

    headers = [{"Content-Type", "application/x-www-form-urlencoded"}]

    case Req.post(@discord_token_url, body: URI.encode_query(body), headers: headers) do
      {:ok, %{status: 200, body: %{"access_token" => token}}} ->
        {:ok, token}
      other ->
        {:error, other}
    end
  end

  def get_user_info(access_token) do
    headers = [{"Authorization", "Bearer #{access_token}"}]

    case Req.get(@discord_user_url, headers: headers) do
      {:ok, %{status: 200, body: body}} ->
        {:ok, %{
          discord_id: body["id"],
          username: body["username"],
          avatar: "https://cdn.discordapp.com/avatars/#{body["id"]}/#{body["avatar"]}.png"
        }}
      other ->
        {:error, other}
    end
  end

  def login_or_register(code, redirect_uri) do
    with {:ok, token} <- get_token(code, redirect_uri),
         {:ok, user_info} <- get_user_info(token) do
      case Backend.Accounts.get_user_by_discord_id(user_info.discord_id) do
        nil ->
          Backend.Accounts.create_user(%{
            discord_id: user_info.discord_id,
            username: user_info.username,
            avatar: user_info.avatar,
            role: "both"
          })
        user ->
          {:ok, user}
      end
    end
  end
end
```

- [ ] **Step 2: Write and run tests (mock external calls)**

```elixir
# test/mock_interview/discord/oauth_test.exs
defmodule Backend.Discord.OAuthTest do
  use Backend.DataCase

  describe "authorize_url/1" do
    test "returns a valid Discord OAuth URL" do
      Application.put_env(:backend, :discord_client_id, "test_client_id")
      url = Backend.Discord.OAuth.authorize_url("http://localhost:4000/auth/discord/callback")
      assert String.contains?(url, "discord.com/api/oauth2/authorize")
      assert String.contains?(url, "client_id=test_client_id")
      assert String.contains?(url, "scope=identify")
    end
  end
end
```

```bash
mix test test/mock_interview/discord/oauth_test.exs
```

- [ ] **Step 3: Commit**

```bash
git add backend/lib/mock_interview/discord/ backend/test/mock_interview/discord/
git commit -m "feat: add Discord OAuth module"
```

---

### Task 8: API Controllers

**Files:**
- Create: `backend/lib/mock_interview_web/controllers/auth_controller.ex`
- Create: `backend/lib/mock_interview_web/controllers/user_controller.ex`
- Create: `backend/lib/mock_interview_web/controllers/topic_controller.ex`
- Create: `backend/lib/mock_interview_web/controllers/question_controller.ex`
- Create: `backend/lib/mock_interview_web/controllers/board_controller.ex`
- Create: `backend/lib/mock_interview_web/controllers/session_controller.ex`
- Create: `backend/lib/mock_interview_web/controllers/feedback_controller.ex`
- Create: `backend/lib/mock_interview_web/controllers/stats_controller.ex`
- Create: `backend/lib/mock_interview_web/controllers/fallback_controller.ex`
- Modify: `backend/lib/mock_interview_web/router.ex`

- [ ] **Step 1: Create fallback controller**

```elixir
# lib/mock_interview_web/controllers/fallback_controller.ex
defmodule BackendWeb.FallbackController do
  use BackendWeb, :controller

  def call(conn, {:error, :not_found}) do
    conn
    |> put_status(:not_found)
    |> json(%{error: "Not found"})
  end

  def call(conn, {:error, %Ecto.Changeset{} = changeset}) do
    conn
    |> put_status(:unprocessable_entity)
    |> json(%{error: "Invalid request", details: traverse_errors(changeset)})
  end

  defp traverse_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
  end
end
```

- [ ] **Step 2: Create AuthController**

```elixir
# lib/mock_interview_web/controllers/auth_controller.ex
defmodule BackendWeb.AuthController do
  use BackendWeb, :controller

  def authorize(conn, _params) do
    base_url = "#{conn.scheme}://#{conn.host}:#{conn.port}"
    redirect_uri = "#{base_url}/auth/discord/callback"
    url = Backend.Discord.OAuth.authorize_url(redirect_uri)
    redirect(conn, external: url)
  end

  def callback(conn, %{"code" => code}) do
    base_url = "#{conn.scheme}://#{conn.host}:#{conn.port}"
    redirect_uri = "#{base_url}/auth/discord/callback"

    case Backend.Discord.OAuth.login_or_register(code, redirect_uri) do
      {:ok, user} ->
        token = Phoenix.Token.sign(conn, "user auth", user.id)
        conn
        |> put_status(:ok)
        |> json(%{token: token, user: %{id: user.id, username: user.username, role: user.role, avatar: user.avatar}})
      {:error, _} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Authentication failed"})
    end
  end
end
```

- [ ] **Step 3: Create UserController**

```elixir
# lib/mock_interview_web/controllers/user_controller.ex
defmodule BackendWeb.UserController do
  use BackendWeb, :controller
  action_fallback BackendWeb.FallbackController

  def me(conn, _params) do
    user = conn.assigns.current_user
    render(conn, :show, user: user)
  end

  def show(conn, %{"id" => id}) do
    user = Backend.Accounts.get_user!(id)
    render(conn, :show, user: user)
  end

  def update_role(conn, %{"role" => role}) do
    user = conn.assigns.current_user
    {:ok, user} = Backend.Accounts.update_user(user, %{role: role})
    render(conn, :show, user: user)
  end
end
```

- [ ] **Step 4: Create TopicController**

```elixir
# lib/mock_interview_web/controllers/topic_controller.ex
defmodule BackendWeb.TopicController do
  use BackendWeb, :controller
  action_fallback BackendWeb.FallbackController

  def index(conn, _params) do
    topics = Backend.Content.list_topics()
    render(conn, :index, topics: topics)
  end

  def show(conn, %{"id" => id}) do
    topic = Backend.Content.get_topic!(id)
    render(conn, :show, topic: topic)
  end

  def create(conn, %{"topic" => topic_params}) do
    {:ok, topic} = Backend.Content.create_topic(topic_params)
    render(conn, :show, topic: topic)
  end

  def delete(conn, %{"id" => id}) do
    topic = Backend.Content.get_topic!(id)
    {:ok, _} = Backend.Content.delete_topic(topic)
    send_resp(conn, :no_content, "")
  end
end
```

- [ ] **Step 5: Create QuestionController**

```elixir
# lib/mock_interview_web/controllers/question_controller.ex
defmodule BackendWeb.QuestionController do
  use BackendWeb, :controller
  action_fallback BackendWeb.FallbackController

  def index(conn, %{"topic_id" => topic_id}) do
    questions = Backend.Content.list_questions(topic_id)
    render(conn, :index, questions: questions)
  end

  def create(conn, %{"question" => question_params}) do
    {:ok, question} = Backend.Content.create_question(question_params)
    render(conn, :show, question: question)
  end

  def delete(conn, %{"id" => id}) do
    question = Backend.Content.get_question!(id)
    {:ok, _} = Backend.Content.delete_question(question)
    send_resp(conn, :no_content, "")
  end
end
```

- [ ] **Step 6: Create BoardController**

```elixir
# lib/mock_interview_web/controllers/board_controller.ex
defmodule BackendWeb.BoardController do
  use BackendWeb, :controller
  action_fallback BackendWeb.FallbackController

  def index(conn, _params) do
    entries = Backend.Sessions.list_open_entries()
    render(conn, :index, entries: entries)
  end

  def create(conn, %{"board_entry" => entry_params}) do
    current_user = conn.assigns.current_user
    params = Map.put(entry_params, "author_id", current_user.id)
    {:ok, entry} = Backend.Sessions.create_board_entry(params)
    Backend.Discord.Webhook.notify_new_board_entry(entry)
    render(conn, :show, entry: entry)
  end

  def apply(conn, %{"id" => id}) do
    current_user = conn.assigns.current_user
    entry = Backend.Sessions.get_board_entry!(id)
    Backend.Sessions.close_board_entry(entry)
    {:ok, session} = Backend.Sessions.create_session(%{
      initiator_id: entry.author_id,
      partner_id: current_user.id,
      topic_id: entry.topic_id,
      board_entry_id: entry.id,
      status: "matched"
    })
    Backend.Discord.Webhook.notify_match(session)
    render(conn, :show, entry: %{entry | status: "matched"})
  end

  def delete(conn, %{"id" => id}) do
    entry = Backend.Sessions.get_board_entry!(id)
    {:ok, _} = Backend.Sessions.delete_board_entry(entry)
    send_resp(conn, :no_content, "")
  end
end
```

- [ ] **Step 7: Create SessionController**

```elixir
# lib/mock_interview_web/controllers/session_controller.ex
defmodule BackendWeb.SessionController do
  use BackendWeb, :controller
  action_fallback BackendWeb.FallbackController

  def index(conn, _params) do
    user = conn.assigns.current_user
    sessions = Backend.Sessions.list_user_sessions(user.id)
    render(conn, :index, sessions: sessions)
  end

  def show(conn, %{"id" => id}) do
    session = Backend.Sessions.get_session!(id)
    render(conn, :show, session: session)
  end

  def create(conn, %{"session" => session_params}) do
    current_user = conn.assigns.current_user
    params = Map.put(session_params, "initiator_id", current_user.id)
    {:ok, session} = Backend.Sessions.create_session(params)
    render(conn, :show, session: session)
  end

  def update_status(conn, %{"id" => id, "status" => status}) do
    session = Backend.Sessions.get_session!(id)
    {:ok, session} = Backend.Sessions.update_session_status(session, status)
    if status == "completed" do
      Backend.Discord.Webhook.notify_session_completed(session)
    end
    render(conn, :show, session: session)
  end

  def delete(conn, %{"id" => id}) do
    session = Backend.Sessions.get_session!(id)
    {:ok, _} = Backend.Sessions.delete_session(session)
    send_resp(conn, :no_content, "")
  end
end
```

- [ ] **Step 8: Create FeedbackController**

```elixir
# lib/mock_interview_web/controllers/feedback_controller.ex
defmodule BackendWeb.FeedbackController do
  use BackendWeb, :controller
  action_fallback BackendWeb.FallbackController

  def create(conn, %{"feedback" => feedback_params}) do
    current_user = conn.assigns.current_user
    params = Map.put(feedback_params, "reviewer_id", current_user.id)
    {:ok, feedback} = Backend.Sessions.create_feedback(params)
    render(conn, :show, feedback: feedback)
  end
end
```

- [ ] **Step 9: Create StatsController**

```elixir
# lib/mock_interview_web/controllers/stats_controller.ex
defmodule BackendWeb.StatsController do
  use BackendWeb, :controller

  def me(conn, _params) do
    user = conn.assigns.current_user
    stats = Backend.Stats.user_stats(user.id)
    json(conn, stats)
  end
end
```

- [ ] **Step 10: Set up router**

```elixir
# lib/mock_interview_web/router.ex — full file
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

    resources "/users", UserController, only: [:show] do
      get "/me", UserController, :me, on: :collection
      patch "/role", UserController, :update_role, on: :collection
    end

    resources "/topics", TopicController, only: [:index, :show, :create, :delete]
    resources "/questions", QuestionController, only: [:index, :create, :delete]

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
```

- [ ] **Step 11: Create Auth plug**

```elixir
# lib/mock_interview_web/plugs/auth.ex
defmodule BackendWeb.Plugs.Auth do
  import Plug.Conn

  def init(opts), do: opts

  def call(conn, _opts) do
    with ["Bearer " <> token] <- get_req_header(conn, "authorization"),
         {:ok, user_id} <- Phoenix.Token.verify(conn, "user auth", token, max_age: 86400 * 30),
         user <- Backend.Accounts.get_user!(user_id) do
      assign(conn, :current_user, user)
    else
      _ ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Unauthorized"})
        |> halt()
    end
  end
end
```

- [ ] **Step 12: Add JSON view**

```elixir
# lib/mock_interview_web/views/user_view.ex
defmodule BackendWeb.UserView do
  use BackendWeb, :view

  def render("show.json", %{user: user}) do
    %{
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      role: user.role,
      rating: user.rating,
      sessions_count: user.sessions_count,
      inserted_at: user.inserted_at
    }
  end
end

# lib/mock_interview_web/views/topic_view.ex
defmodule BackendWeb.TopicView do
  use BackendWeb, :view

  def render("index.json", %{topics: topics}) do
    render_many(topics, __MODULE__, "show.json")
  end

  def render("show.json", %{topic: topic}) do
    %{id: topic.id, name: topic.name, category: topic.category, icon: topic.icon, description: topic.description}
  end
end

# lib/mock_interview_web/views/question_view.ex
defmodule BackendWeb.QuestionView do
  use BackendWeb, :view

  def render("index.json", %{questions: questions}) do
    render_many(questions, __MODULE__, "show.json")
  end

  def render("show.json", %{question: question}) do
    %{id: question.id, topic_id: question.topic_id, level: question.level, text: question.text, tags: question.tags}
  end
end

# lib/mock_interview_web/views/board_entry_view.ex
defmodule BackendWeb.BoardEntryView do
  use BackendWeb, :view

  def render("index.json", %{entries: entries}) do
    render_many(entries, __MODULE__, "show.json")
  end

  def render("show.json", %{entry: entry}) do
    %{
      id: entry.id,
      author: %{id: entry.author.id, username: entry.author.username, avatar: entry.author.avatar, role: entry.author.role},
      topic: %{id: entry.topic.id, name: entry.topic.name, category: entry.topic.category},
      looking_for: entry.looking_for,
      time_slot: entry.time_slot,
      description: entry.description,
      status: entry.status,
      inserted_at: entry.inserted_at
    }
  end
end

# lib/mock_interview_web/views/session_view.ex
defmodule BackendWeb.SessionView do
  use BackendWeb, :view

  def render("index.json", %{sessions: sessions}) do
    render_many(sessions, __MODULE__, "show.json")
  end

  def render("show.json", %{session: session}) do
    %{
      id: session.id,
      initiator: %{id: session.initiator.id, username: session.initiator.username},
      partner: session.partner && %{id: session.partner.id, username: session.partner.username},
      topic: %{id: session.topic.id, name: session.topic.name},
      status: session.status,
      scheduled_at: session.scheduled_at,
      inserted_at: session.inserted_at
    }
  end
end

# lib/mock_interview_web/views/feedback_view.ex
defmodule BackendWeb.FeedbackView do
  use BackendWeb, :view

  def render("show.json", %{feedback: feedback}) do
    %{id: feedback.id, rating: feedback.rating, comment: feedback.comment, reviewer_id: feedback.reviewer_id}
  end
end
```

- [ ] **Step 13: Run tests**

```bash
mix test
```

Expected: All existing tests pass.

- [ ] **Step 14: Commit**

```bash
git add backend/lib/mock_interview_web/controllers/ backend/lib/mock_interview_web/plugs/ backend/lib/mock_interview_web/views/ backend/lib/mock_interview_web/router.ex
git commit -m "feat: add API controllers and routes"
```

---

### Task 9: Discord Webhook Module

**Files:**
- Create: `backend/lib/mock_interview/discord/webhook.ex`

- [ ] **Step 1: Create Webhook module**

```elixir
# lib/mock_interview/discord/webhook.ex
defmodule Backend.Discord.Webhook do
  @webhook_url Application.compile_env(:backend, :discord_webhook_url)

  def notify_new_board_entry(entry) do
    entry = entry |> Backend.Repo.preload([:author, :topic])
    message = %{
      content: nil,
      embeds: [%{
        title: "Новое объявление на доске!",
        description: "#{entry.author.username} ищет **#{entry.looking_for}** для собеса по **#{entry.topic.name}**",
        color: 5814783,
        fields: [
          %{name: "Описание", value: entry.description || "Без описания", inline: false},
          %{name: "Статус", value: "Открыто", inline: true}
        ],
        timestamp: DateTime.utc_now() |> DateTime.to_iso8601()
      }]
    }
    send(message)
  end

  def notify_match(session) do
    session = session |> Backend.Repo.preload([:initiator, :partner, :topic])
    message = %{
      content: nil,
      embeds: [%{
        title: "Пара найдена!",
        description: "#{session.initiator.username} и #{session.partner.username} — собеседование по **#{session.topic.name}**",
        color: 5763719,
        fields: [
          %{name: "Инициатор", value: session.initiator.username, inline: true},
          %{name: "Напарник", value: session.partner.username, inline: true}
        ],
        timestamp: DateTime.utc_now() |> DateTime.to_iso8601()
      }]
    }
    send(message)
  end

  def notify_session_completed(session) do
    session = session |> Backend.Repo.preload([:initiator, :partner, :topic])
    message = %{
      content: nil,
      embeds: [%{
        title: "Собеседование завершено!",
        description: "#{session.initiator.username} и #{session.partner.username} завершили собес по **#{session.topic.name}**",
        color: 10181046,
        timestamp: DateTime.utc_now() |> DateTime.to_iso8601()
      }]
    }
    send(message)
  end

  defp send(payload) do
    if @webhook_url do
      Req.post(@webhook_url, json: payload)
    end
  end
end
```

- [ ] **Step 2: Add webhook URL to config**

```elixir
# In config/dev.exs
config :backend, :discord_webhook_url, System.get_env("DISCORD_WEBHOOK_URL")
config :backend, :discord_client_id, System.get_env("DISCORD_CLIENT_ID")
config :backend, :discord_client_secret, System.get_env("DISCORD_CLIENT_SECRET")

# In config/prod.exs
config :backend, :discord_webhook_url, System.get_env("DISCORD_WEBHOOK_URL")
config :backend, :discord_client_id, System.get_env("DISCORD_CLIENT_ID")
config :backend, :discord_client_secret, System.get_env("DISCORD_CLIENT_SECRET")
```

- [ ] **Step 3: Commit**

```bash
git add backend/lib/mock_interview/discord/webhook.ex backend/config/
git commit -m "feat: add Discord webhook notifications"
```

---

### Task 10: Next.js Project Scaffolding

**Files:**
- Create: `frontend/` (full Next.js project)

- [ ] **Step 1: Create Next.js project**

```bash
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-npm
cd frontend
```

- [ ] **Step 2: Set up types**

```typescript
// frontend/src/types/index.ts
export interface User {
  id: string
  username: string
  avatar: string
  role: 'interviewer' | 'interviewee' | 'both'
  rating: number
  sessions_count: number
  inserted_at: string
}

export interface Topic {
  id: string
  name: string
  category: string
  icon?: string
  description?: string
}

export interface Question {
  id: string
  topic_id: string
  level: 'junior' | 'middle' | 'senior'
  text: string
  tags: string[]
}

export interface BoardEntry {
  id: string
  author: Pick<User, 'id' | 'username' | 'avatar' | 'role'>
  topic: Pick<Topic, 'id' | 'name' | 'category'>
  looking_for: 'interviewer' | 'interviewee'
  time_slot?: string
  description?: string
  status: 'open' | 'matched' | 'closed'
  inserted_at: string
}

export interface Session {
  id: string
  initiator: Pick<User, 'id' | 'username'>
  partner?: Pick<User, 'id' | 'username'>
  topic: Pick<Topic, 'id' | 'name'>
  status: 'pending' | 'matched' | 'in_progress' | 'completed' | 'cancelled'
  scheduled_at?: string
  inserted_at: string
}

export interface Feedback {
  id: string
  rating: number
  comment?: string
  reviewer_id: string
}

export interface UserStats {
  total_sessions: number
  feedback_given: number
  feedback_received: number
  avg_rating: number
  topics_covered: string[]
  as_initiator: number
  as_partner: number
}
```

- [ ] **Step 3: Create API client**

```typescript
// frontend/src/lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token')
  }
  return null
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  auth: {
    getDiscordUrl: () => `${API_BASE}/auth/discord`,
    callback: (code: string) =>
      request<{ token: string; user: User }>(`/auth/discord/callback?code=${code}`),
  },
  users: {
    me: () => request<User>('/api/users/me'),
    get: (id: string) => request<User>(`/api/users/${id}`),
    updateRole: (role: string) =>
      request<User>(`/api/users/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  },
  topics: {
    list: () => request<Topic[]>('/api/topics'),
    get: (id: string) => request<Topic>(`/api/topics/${id}`),
    create: (data: Partial<Topic>) =>
      request<Topic>('/api/topics', { method: 'POST', body: JSON.stringify({ topic: data }) }),
    delete: (id: string) =>
      request<void>(`/api/topics/${id}`, { method: 'DELETE' }),
  },
  questions: {
    list: (topicId: string) =>
      request<Question[]>(`/api/questions?topic_id=${topicId}`),
    create: (data: Partial<Question>) =>
      request<Question>('/api/questions', { method: 'POST', body: JSON.stringify({ question: data }) }),
    delete: (id: string) =>
      request<void>(`/api/questions/${id}`, { method: 'DELETE' }),
  },
  board: {
    list: () => request<BoardEntry[]>('/api/board'),
    create: (data: Partial<BoardEntry>) =>
      request<BoardEntry>('/api/board', { method: 'POST', body: JSON.stringify({ board_entry: data }) }),
    apply: (id: string) =>
      request<BoardEntry>(`/api/board/${id}/apply`, { method: 'POST' }),
    delete: (id: string) =>
      request<void>(`/api/board/${id}`, { method: 'DELETE' }),
  },
  sessions: {
    list: () => request<Session[]>('/api/sessions'),
    get: (id: string) => request<Session>(`/api/sessions/${id}`),
    create: (data: Partial<Session>) =>
      request<Session>('/api/sessions', { method: 'POST', body: JSON.stringify({ session: data }) }),
    updateStatus: (id: string, status: string) =>
      request<Session>(`/api/sessions/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    delete: (id: string) =>
      request<void>(`/api/sessions/${id}`, { method: 'DELETE' }),
  },
  feedback: {
    create: (sessionId: string, data: { rating: number; comment?: string }) =>
      request<Feedback>(`/api/sessions/${sessionId}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ feedback: data }),
      }),
  },
  stats: {
    me: () => request<UserStats>('/api/stats/me'),
  },
}
```

- [ ] **Step 4: Create AuthContext**

```typescript
// frontend/src/lib/auth.tsx
'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '@/types'
import { api } from '@/lib/api'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: () => void
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  refreshUser: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.users.me()
        .then(setUser)
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = () => {
    window.location.href = api.auth.getDiscordUrl()
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const refreshUser = async () => {
    const u = await api.users.me()
    setUser(u)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

- [ ] **Step 5: Create landing page**

```tsx
// frontend/src/app/page.tsx
'use client'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const { user, loading, login } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg text-gray-500">Загрузка...</p>
    </div>
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-4">MockInterview</h1>
      <p className="text-lg text-gray-600 mb-8 text-center max-w-md">
        Подготовка к техническим собеседованиям с напарниками
      </p>
      <button
        onClick={login}
        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
      >
        Войти через Discord
      </button>
    </div>
  )
}
```

- [ ] **Step 6: Create layout with AuthProvider**

```tsx
// frontend/src/app/layout.tsx
import type { Metadata } from 'next'
import { AuthProvider } from '@/lib/auth'
import './globals.css'

export const metadata: Metadata = {
  title: 'MockInterview',
  description: 'Platform for technical interview preparation',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add frontend/
git commit -m "feat: scaffold Next.js frontend with auth and API client"
```

---

### Task 11: Auth Callback + Onboarding Pages

**Files:**
- Create: `frontend/src/app/auth/callback/page.tsx`
- Create: `frontend/src/app/onboarding/page.tsx`

- [ ] **Step 1: Auth callback page**

```tsx
// frontend/src/app/auth/callback/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export default function AuthCallback() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    if (!code) {
      setError('No authorization code received')
      return
    }

    api.auth.callback(code)
      .then(({ token, user }) => {
        localStorage.setItem('token', token)
        if (user.role === 'both' && !user.sessions_count) {
          router.push('/onboarding')
        } else {
          router.push('/dashboard')
        }
      })
      .catch(() => {
        setError('Authentication failed')
      })
  }, [router])

  if (error) {
    return <div className="flex items-center justify-center min-h-screen">
      <p className="text-red-500">{error}</p>
    </div>
  }

  return <div className="flex items-center justify-center min-h-screen">
    <p className="text-lg text-gray-500">Авторизация через Discord...</p>
  </div>
}
```

- [ ] **Step 2: Onboarding page**

```tsx
// frontend/src/app/onboarding/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'

export default function Onboarding() {
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { refreshUser } = useAuth()

  const handleSubmit = async () => {
    if (!selectedRole) return
    setLoading(true)
    try {
      await api.users.updateRole(selectedRole)
      await refreshUser()
      router.push('/dashboard')
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Выберите роль</h1>
      <div className="grid gap-4 w-full max-w-md">
        {[
          { value: 'interviewer', label: 'Интервьюер', desc: 'Провожу собеседования' },
          { value: 'interviewee', label: 'Кандидат', desc: 'Прохожу собеседования' },
          { value: 'both', label: 'Оба варианта', desc: 'Хочу и проводить, и проходить' },
        ].map(({ value, label, desc }) => (
          <button
            key={value}
            onClick={() => setSelectedRole(value)}
            className={`p-4 rounded-lg border-2 text-left transition ${
              selectedRole === value
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-semibold">{label}</div>
            <div className="text-sm text-gray-500">{desc}</div>
          </button>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        disabled={!selectedRole || loading}
        className="mt-8 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
      >
        {loading ? 'Сохранение...' : 'Продолжить'}
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/auth/ frontend/src/app/onboarding/
git commit -m "feat: add auth callback and onboarding pages"
```

---

### Task 12: Header + Authenticated Layout

**Files:**
- Create: `frontend/src/components/Header.tsx`
- Create: `frontend/src/app/(authenticated)/layout.tsx`

- [ ] **Step 1: Create Header component**

```tsx
// frontend/src/components/Header.tsx
'use client'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'

export function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-bold text-lg">
            MockInterview
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Дашборд</Link>
            <Link href="/topics" className="text-gray-600 hover:text-gray-900">Темы</Link>
            <Link href="/board" className="text-gray-600 hover:text-gray-900">Доска</Link>
            <Link href="/sessions" className="text-gray-600 hover:text-gray-900">Сессии</Link>
          </nav>
        </div>
        {user && (
          <div className="flex items-center gap-3">
            <Link href={`/profile/${user.id}`} className="text-sm text-gray-600 hover:text-gray-900">
              {user.username}
            </Link>
            <button onClick={logout} className="text-sm text-red-500 hover:text-red-700">
              Выйти
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Create authenticated layout**

```tsx
// frontend/src/app/(authenticated)/layout.tsx
'use client'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Header } from '@/components/Header'

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading || !user) {
    return <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">Загрузка...</p>
    </div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Header.tsx frontend/src/app/(authenticated)/
git commit -m "feat: add header and authenticated layout"
```

---

### Task 13: Dashboard Page

**Files:**
- Create: `frontend/src/app/(authenticated)/dashboard/page.tsx`
- Create: `frontend/src/components/StatsWidget.tsx`

- [ ] **Step 1: Create StatsWidget component**

```tsx
// frontend/src/components/StatsWidget.tsx
import { UserStats } from '@/types'

interface Props {
  stats: UserStats
}

export function StatsWidget({ stats }: Props) {
  const items = [
    { label: 'Всего сессий', value: stats.total_sessions },
    { label: 'Как интервьюер', value: stats.as_initiator },
    { label: 'Как кандидат', value: stats.as_partner },
    { label: 'Рейтинг', value: stats.avg_rating.toFixed(1) },
    { label: 'Фидбек дан', value: stats.feedback_given },
    { label: 'Тем покрыто', value: stats.topics_covered.length },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {items.map(({ label, value }) => (
        <div key={label} className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm text-gray-500">{label}</div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create Dashboard page**

```tsx
// frontend/src/app/(authenticated)/dashboard/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { StatsWidget } from '@/components/StatsWidget'
import { UserStats, Session } from '@/types'
import Link from 'next/link'

export default function Dashboard() {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [recentSessions, setRecentSessions] = useState<Session[]>([])

  useEffect(() => {
    api.stats.me().then(setStats)
    api.sessions.list().then(s => setRecentSessions(s.slice(0, 5)))
  }, [])

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Дашборд</h1>
      {stats && <StatsWidget stats={stats} />}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Последние сессии</h2>
          <Link href="/sessions" className="text-sm text-indigo-600 hover:text-indigo-800">
            Все сессии →
          </Link>
        </div>
        {recentSessions.length === 0 ? (
          <p className="text-gray-500">У вас пока нет сессий. Найдите напарника на <Link href="/board" className="text-indigo-600">доске</Link>!</p>
        ) : (
          <div className="space-y-2">
            {recentSessions.map(s => (
              <Link key={s.id} href={`/sessions/${s.id}`} className="block bg-white p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{s.topic.name}</span>
                    <span className="text-gray-500 ml-2">— {s.status}</span>
                  </div>
                  <span className="text-sm text-gray-400">{new Date(s.inserted_at).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/(authenticated)/dashboard/ frontend/src/components/StatsWidget.tsx
git commit -m "feat: add dashboard page with stats"
```

---

### Task 14: Topics & Questions Pages

**Files:**
- Create: `frontend/src/app/(authenticated)/topics/page.tsx`
- Create: `frontend/src/app/(authenticated)/topics/[id]/page.tsx`

- [ ] **Step 1: Topics list page**

```tsx
// frontend/src/app/(authenticated)/topics/page.tsx
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Topic } from '@/types'

const categoryIcons: Record<string, string> = {
  Algorithms: '⚡',
  'System Design': '🏗️',
  SQL: '🗄️',
}

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [grouped, setGrouped] = useState<Record<string, Topic[]>>({})

  useEffect(() => {
    api.topics.list().then(t => {
      setTopics(t)
      const g: Record<string, Topic[]> = {}
      t.forEach(topic => {
        if (!g[topic.category]) g[topic.category] = []
        g[topic.category].push(topic)
      })
      setGrouped(g)
    })
  }, [])

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Темы</h1>
      {Object.entries(grouped).map(([category, topics]) => (
        <div key={category}>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span>{categoryIcons[category] || '📚'}</span>
            {category}
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {topics.map(t => (
              <Link
                key={t.id}
                href={`/topics/${t.id}`}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:border-indigo-300 transition"
              >
                <div className="font-medium">{t.name}</div>
                {t.description && (
                  <div className="text-sm text-gray-500 mt-1">{t.description}</div>
                )}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Topic detail page**

```tsx
// frontend/src/app/(authenticated)/topics/[id]/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { Topic, Question } from '@/types'

const levelColors: Record<string, string> = {
  junior: 'bg-green-100 text-green-800',
  middle: 'bg-yellow-100 text-yellow-800',
  senior: 'bg-red-100 text-red-800',
}

export default function TopicDetail() {
  const { id } = useParams<{ id: string }>()
  const [topic, setTopic] = useState<Topic | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])

  useEffect(() => {
    if (id) {
      api.topics.get(id).then(setTopic)
      api.questions.list(id).then(setQuestions)
    }
  }, [id])

  if (!topic) return <p className="text-gray-500">Загрузка...</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{topic.name}</h1>
        <p className="text-gray-500">{topic.description}</p>
      </div>
      <div className="space-y-2">
        {questions.map(q => (
          <div key={q.id} className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-start justify-between">
              <div className="text-sm font-medium">{q.text}</div>
              <span className={`text-xs px-2 py-1 rounded ${levelColors[q.level] || ''}`}>{q.level}</span>
            </div>
            {q.tags.length > 0 && (
              <div className="flex gap-1 mt-2">
                {q.tags.map(tag => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{tag}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/(authenticated)/topics/
git commit -m "feat: add topics and questions pages"
```

---

### Task 15: Board Page

**Files:**
- Create: `frontend/src/app/(authenticated)/board/page.tsx`
- Create: `frontend/src/components/BoardCard.tsx`

- [ ] **Step 1: Create BoardCard component**

```tsx
// frontend/src/components/BoardCard.tsx
import { BoardEntry } from '@/types'
import { useAuth } from '@/lib/auth'

interface Props {
  entry: BoardEntry
  onApply: (id: string) => void
  onDelete: (id: string) => void
}

export function BoardCard({ entry, onApply, onDelete }: Props) {
  const { user } = useAuth()
  const isOwn = user?.id === entry.author.id

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{entry.author.username}</span>
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{entry.author.role}</span>
          </div>
          <div className="text-sm mt-1">
            Ищет: <strong>{entry.looking_for === 'interviewer' ? 'интервьюера' : 'кандидата'}</strong>
            {' · '}Тема: <strong>{entry.topic.name}</strong>
          </div>
          {entry.description && (
            <div className="text-sm text-gray-500 mt-2">{entry.description}</div>
          )}
          {entry.time_slot && (
            <div className="text-sm text-gray-400 mt-1">
              {new Date(entry.time_slot).toLocaleString()}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {!isOwn && entry.status === 'open' && (
            <button
              onClick={() => onApply(entry.id)}
              className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition"
            >
              Откликнуться
            </button>
          )}
          {isOwn && (
            <button
              onClick={() => onDelete(entry.id)}
              className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition"
            >
              Удалить
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create Board page**

```tsx
// frontend/src/app/(authenticated)/board/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { BoardEntry, Topic } from '@/types'
import { BoardCard } from '@/components/BoardCard'
import { useAuth } from '@/lib/auth'

export default function BoardPage() {
  const [entries, setEntries] = useState<BoardEntry[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ topic_id: '', looking_for: 'interviewee', description: '', time_slot: '' })
  const { user } = useAuth()

  const load = () => {
    api.board.list().then(setEntries)
    api.topics.list().then(setTopics)
  }

  useEffect(load, [])

  const handleCreate = async () => {
    await api.board.create({
      ...form,
      time_slot: form.time_slot ? new Date(form.time_slot).toISOString() : undefined,
    } as any)
    setShowForm(false)
    setForm({ topic_id: '', looking_for: 'interviewee', description: '', time_slot: '' })
    load()
  }

  const handleApply = async (id: string) => {
    await api.board.apply(id)
    load()
  }

  const handleDelete = async (id: string) => {
    await api.board.delete(id)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Доска объявлений</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
        >
          {showForm ? 'Отмена' : 'Создать объявление'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Тема</label>
            <select
              value={form.topic_id}
              onChange={e => setForm({ ...form, topic_id: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Выберите тему</option>
              {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ищу</label>
            <select
              value={form.looking_for}
              onChange={e => setForm({ ...form, looking_for: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="interviewee">Кандидата</option>
              <option value="interviewer">Интервьюера</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Описание</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Время (опционально)</label>
            <input
              type="datetime-local"
              value={form.time_slot}
              onChange={e => setForm({ ...form, time_slot: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={!form.topic_id}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm disabled:opacity-50"
          >
            Создать
          </button>
        </div>
      )}

      <div className="space-y-3">
        {entries.map(e => (
          <BoardCard key={e.id} entry={e} onApply={handleApply} onDelete={handleDelete} />
        ))}
        {entries.length === 0 && <p className="text-gray-500">Объявлений пока нет</p>}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/(authenticated)/board/ frontend/src/components/BoardCard.tsx
git commit -m "feat: add board page with create and apply"
```

---

### Task 16: Sessions Pages

**Files:**
- Create: `frontend/src/app/(authenticated)/sessions/page.tsx`
- Create: `frontend/src/app/(authenticated)/sessions/[id]/page.tsx`
- Create: `frontend/src/components/FeedbackForm.tsx`

- [ ] **Step 1: Sessions list page**

```tsx
// frontend/src/app/(authenticated)/sessions/page.tsx
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Session } from '@/types'

const statusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  matched: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    api.sessions.list().then(setSessions)
  }, [])

  const filtered = filter === 'all' ? sessions : sessions.filter(s => s.status === filter)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Мои сессии</h1>
      <div className="flex gap-2">
        {['all', 'pending', 'matched', 'in_progress', 'completed', 'cancelled'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 text-sm rounded transition ${
              filter === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === 'all' ? 'Все' : s}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.map(s => (
          <Link key={s.id} href={`/sessions/${s.id}`} className="block bg-white p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">{s.topic.name}</span>
                <span className="text-gray-500 ml-2">
                  {s.initiator.username}{s.partner ? ` × ${s.partner.username}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded ${statusColors[s.status] || ''}`}>{s.status}</span>
                <span className="text-sm text-gray-400">{new Date(s.inserted_at).toLocaleDateString()}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create FeedbackForm component**

```tsx
// frontend/src/components/FeedbackForm.tsx
'use client'
import { useState } from 'react'
import { api } from '@/lib/api'

interface Props {
  sessionId: string
  onSubmitted: () => void
}

export function FeedbackForm({ sessionId, onSubmitted }: Props) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!rating) return
    setSubmitting(true)
    try {
      await api.feedback.create(sessionId, { rating, comment })
      onSubmitted()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
      <h3 className="font-semibold">Оставить фидбек</h3>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onClick={() => setRating(n)}
            className={`w-10 h-10 rounded-full text-lg transition ${
              n <= rating ? 'bg-yellow-400 text-white' : 'bg-gray-100 text-gray-400'
            }`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Комментарий (опционально)"
        className="w-full border border-gray-300 rounded px-3 py-2"
        rows={3}
      />
      <button
        onClick={handleSubmit}
        disabled={!rating || submitting}
        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition disabled:opacity-50"
      >
        {submitting ? 'Отправка...' : 'Отправить'}
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Session detail page**

```tsx
// frontend/src/app/(authenticated)/sessions/[id]/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { Session, Feedback } from '@/types'
import { FeedbackForm } from '@/components/FeedbackForm'
import { useAuth } from '@/lib/auth'

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>()
  const [session, setSession] = useState<Session | null>(null)
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const { user } = useAuth()

  const load = () => {
    if (id) {
      api.sessions.get(id).then(setSession)
    }
  }

  useEffect(load, [id])

  const handleStatusChange = async (status: string) => {
    if (!id) return
    await api.sessions.updateStatus(id, status)
    load()
  }

  const handleFeedbackSubmitted = async () => {
    if (!id) return
    load()
  }

  if (!session) return <p className="text-gray-500">Загрузка...</p>

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Детали сессии</h1>
      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-3">
        <div><span className="text-gray-500">Тема:</span> <strong>{session.topic.name}</strong></div>
        <div><span className="text-gray-500">Инициатор:</span> {session.initiator.username}</div>
        <div><span className="text-gray-500">Напарник:</span> {session.partner?.username || '—'}</div>
        <div><span className="text-gray-500">Статус:</span> {session.status}</div>
        <div className="flex gap-2">
          {session.status === 'matched' && (
            <button onClick={() => handleStatusChange('in_progress')} className="px-4 py-2 bg-yellow-500 text-white rounded text-sm">
              Начать собес
            </button>
          )}
          {session.status === 'in_progress' && (
            <button onClick={() => handleStatusChange('completed')} className="px-4 py-2 bg-green-600 text-white rounded text-sm">
              Завершить
            </button>
          )}
        </div>
      </div>
      {session.status === 'completed' && user && (
        <FeedbackForm sessionId={session.id} onSubmitted={handleFeedbackSubmitted} />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/(authenticated)/sessions/ frontend/src/components/FeedbackForm.tsx
git commit -m "feat: add sessions list and detail pages"
```

---

### Task 17: Profile Page

**Files:**
- Create: `frontend/src/app/(authenticated)/profile/[id]/page.tsx`

- [ ] **Step 1: Create profile page**

```tsx
// frontend/src/app/(authenticated)/profile/[id]/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { User } from '@/types'
import { StatsWidget } from '@/components/StatsWidget'
import { UserStats } from '@/types'

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [profile, setProfile] = useState<User | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)

  useEffect(() => {
    if (id) {
      api.users.get(id).then(setProfile)
    }
  }, [id])

  if (!profile) return <p className="text-gray-500">Загрузка...</p>

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center gap-4">
        {profile.avatar && (
          <img src={profile.avatar} alt={profile.username} className="w-16 h-16 rounded-full" />
        )}
        <div>
          <h1 className="text-2xl font-bold">{profile.username}</h1>
          <div className="flex gap-2 mt-1">
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{profile.role}</span>
            <span className="text-sm text-gray-500">Рейтинг: {profile.rating.toFixed(1)}</span>
            <span className="text-sm text-gray-500">Сессий: {profile.sessions_count}</span>
          </div>
        </div>
      </div>
      {stats && <StatsWidget stats={stats} />}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/app/(authenticated)/profile/
git commit -m "feat: add profile page"
```

---

### Task 18: Admin Page

**Files:**
- Create: `frontend/src/app/(authenticated)/admin/page.tsx`

- [ ] **Step 1: Create admin page**

```tsx
// frontend/src/app/(authenticated)/admin/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Topic, Question } from '@/types'

export default function AdminPage() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedTopic, setSelectedTopic] = useState<string>('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [newTopicName, setNewTopicName] = useState('')
  const [newTopicCategory, setNewTopicCategory] = useState('Algorithms')
  const [newQuestionText, setNewQuestionText] = useState('')
  const [newQuestionLevel, setNewQuestionLevel] = useState<'junior' | 'middle' | 'senior'>('middle')

  const loadTopics = () => api.topics.list().then(setTopics)

  useEffect(loadTopics, [])

  useEffect(() => {
    if (selectedTopic) api.questions.list(selectedTopic).then(setQuestions)
  }, [selectedTopic])

  const handleCreateTopic = async () => {
    if (!newTopicName) return
    await api.topics.create({ name: newTopicName, category: newTopicCategory } as any)
    setNewTopicName('')
    loadTopics()
  }

  const handleDeleteTopic = async (id: string) => {
    await api.topics.delete(id)
    loadTopics()
  }

  const handleCreateQuestion = async () => {
    if (!newQuestionText || !selectedTopic) return
    await api.questions.create({ topic_id: selectedTopic, text: newQuestionText, level: newQuestionLevel } as any)
    setNewQuestionText('')
    if (selectedTopic) api.questions.list(selectedTopic).then(setQuestions)
  }

  const handleDeleteQuestion = async (id: string) => {
    await api.questions.delete(id)
    if (selectedTopic) api.questions.list(selectedTopic).then(setQuestions)
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-2xl font-bold">Админка</h1>

      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <h2 className="font-semibold">Темы</h2>
        <div className="flex gap-2">
          <input
            value={newTopicName}
            onChange={e => setNewTopicName(e.target.value)}
            placeholder="Название темы"
            className="flex-1 border border-gray-300 rounded px-3 py-2"
          />
          <select
            value={newTopicCategory}
            onChange={e => setNewTopicCategory(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          >
            <option value="Algorithms">Algorithms</option>
            <option value="System Design">System Design</option>
            <option value="SQL">SQL</option>
          </select>
          <button onClick={handleCreateTopic} className="px-4 py-2 bg-green-600 text-white rounded text-sm">
            Добавить
          </button>
        </div>
        <div className="space-y-2">
          {topics.map(t => (
            <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <span className="font-medium">{t.name}</span>
                <span className="text-sm text-gray-500 ml-2">{t.category}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSelectedTopic(t.id)} className="text-sm text-indigo-600 hover:text-indigo-800">
                  Вопросы
                </button>
                <button onClick={() => handleDeleteTopic(t.id)} className="text-sm text-red-500 hover:text-red-700">
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedTopic && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
          <h2 className="font-semibold">Вопросы по теме</h2>
          <div className="flex gap-2">
            <input
              value={newQuestionText}
              onChange={e => setNewQuestionText(e.target.value)}
              placeholder="Текст вопроса"
              className="flex-1 border border-gray-300 rounded px-3 py-2"
            />
            <select
              value={newQuestionLevel}
              onChange={e => setNewQuestionLevel(e.target.value as any)}
              className="border border-gray-300 rounded px-3 py-2"
            >
              <option value="junior">Junior</option>
              <option value="middle">Middle</option>
              <option value="senior">Senior</option>
            </select>
            <button onClick={handleCreateQuestion} className="px-4 py-2 bg-green-600 text-white rounded text-sm">
              Добавить
            </button>
          </div>
          <div className="space-y-2">
            {questions.map(q => (
              <div key={q.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <span>{q.text}</span>
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded ml-2">{q.level}</span>
                </div>
                <button onClick={() => handleDeleteQuestion(q.id)} className="text-sm text-red-500 hover:text-red-700">
                  Удалить
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/app/(authenticated)/admin/
git commit -m "feat: add admin page for managing topics and questions"
```

---

## Self-Review Checklist

1. **Spec coverage:** Every requirement from the spec has a corresponding task — Discord OAuth (Task 7 + 11), roles (Task 11), board (Task 15), sessions (Task 16), feedback (Task 16), topics/questions (Task 14 + 18), stats (Task 6 + 13), webhooks (Task 9), profile (Task 17).
2. **Placeholder scan:** All code is complete. No TBDs, TODOs, or vague instructions.
3. **Type consistency:** Types defined in Task 10 (frontend types + API client) are used consistently in all frontend tasks. Backend schemas and contexts referenced by controllers are consistent.
