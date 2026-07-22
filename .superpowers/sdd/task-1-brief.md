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
