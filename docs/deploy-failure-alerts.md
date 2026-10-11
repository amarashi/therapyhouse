# Deploy failure alerts

Clinic staff save content through Pages CMS, and those saves are committed to
`main` by the clinic's GitHub App, not by a person. GitHub only emails the
person who pushed a commit when a workflow fails, so a save that breaks the
build would otherwise alert nobody (issue #99). This page explains what alerts
you today and what to switch on if production builds move to Cloudflare.

## While the site deploys from GitHub Actions (today)

`.github/workflows/deploy.yml` runs the tests (`pnpm test`), builds the site
(`pnpm build`) and publishes it to GitHub Pages. Its last job, `report`, runs
`.github/scripts/deploy-alert.sh`:

- **When a deploy fails**, it opens an issue labelled `build-failure` and
  assigns it to @amarashi. If such an issue is already open, it adds a comment
  to it instead, so repeated failures stay in one place. The issue says which
  step failed, who made each commit in the push and its message, which files
  changed, the names of any failing tests with their file and line, the last
  80 lines of the test or build log, and a link to the run. The site is not
  updated by a failed deploy; the previous version stays live.
- **When a later deploy succeeds**, it closes every open `build-failure` issue
  with a comment that links the successful run.
- A cancelled run does neither.

GitHub emails you about the new issue because it is assigned to you. Check that
issue emails are on under GitHub's notification settings if they do not arrive.
The workflow creates the `build-failure` label itself the first time it needs
it.

## If production builds run on Cloudflare instead

The alert above only covers builds that run in GitHub Actions. If Cloudflare
builds the site from the repository instead (issue #98), a failed Cloudflare
build will not trigger it, and you need Cloudflare's own alert. Which one
depends on the Cloudflare product that does the building.

### Cloudflare Pages

Cloudflare has a notification type called **Pages: Project updates**. It can be
limited to chosen Pages projects and environments (production or preview), and
to the events "Deployment started", "Deployment failed" and "Deployment
success". To set it up, following Cloudflare's
[Get started with notifications](https://developers.cloudflare.com/notifications/get-started/)
page:

1. In the Cloudflare dashboard, go to **Alerts** > **Overview**.
2. Select **Create an Alert**.
3. Choose **Pages: Project updates** and select **Select**.
4. Give the alert a name.
5. Add a delivery destination. Email is the simplest; webhook and PagerDuty
   are the other options.
6. Limit it to this site's project, the production environment, and the
   "Deployment failed" event only, so you are not emailed for every
   successful save.
7. Select **Create**.

The list of notification types is on Cloudflare's
[Available notifications](https://developers.cloudflare.com/notifications/notification-available/)
page. These steps come from Cloudflare's documentation and have not been
checked in a live dashboard, so the screens may differ slightly.

### Cloudflare Workers Builds

If the site is built by Workers Builds (Cloudflare's build service for
Workers, which the OpenNext setup in #93 uses for the CMS), Cloudflare's
documentation (checked October 2026) describes no ready-made email alert for a
failed build. The
[Available notifications](https://developers.cloudflare.com/notifications/notification-available/)
page lists none for Workers Builds. What the documentation does describe:

- **GitHub check runs.** Workers Builds reports each build's result back to
  GitHub as a check run on the commit
  ([GitHub integration](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/)).
  The failure is visible on the commit in GitHub, but because the commit was
  made by the GitHub App, it is unclear whether GitHub emails anyone about it.
  Do not rely on it as an alert without testing it.
- **Queue event subscriptions.** Cloudflare Queues (a message queue service)
  can subscribe to Workers Builds events, including
  `cf.workersBuilds.worker.build.failed`
  ([event schemas](https://developers.cloudflare.com/queues/event-subscriptions/events-schemas/)).
  The subscription only places a message on a queue; something you write, such
  as a small Worker, then has to read the queue and send the email. The setup
  is described in
  [Manage event subscriptions](https://developers.cloudflare.com/queues/event-subscriptions/manage-event-subscriptions/).

The simpler option is to keep running `pnpm test` in GitHub Actions on every
push to `main`, even when Cloudflare does the production build. The tests are
what usually fail when a CMS save is wrong, and the `report` job above would
then still open the issue.
