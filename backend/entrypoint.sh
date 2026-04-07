#!/bin/sh
set -eu

# Accept common Postgres URL formats (postgres:// or postgresql://) and
# convert them to Spring's JDBC settings when explicit SPRING_DATASOURCE_*
# variables are not already provided.
if [ -n "${DATABASE_URL:-}" ] && [ -z "${SPRING_DATASOURCE_URL:-}" ]; then
  case "$DATABASE_URL" in
    postgres://*|postgresql://*)
      URI_NO_SCHEME="${DATABASE_URL#*://}"
      AUTH_AND_HOST="${URI_NO_SCHEME%%/*}"
      DB_AND_QUERY="${URI_NO_SCHEME#*/}"

      USERINFO="${AUTH_AND_HOST%@*}"
      HOSTPORT="${AUTH_AND_HOST#*@}"

      DB_NAME="${DB_AND_QUERY%%\?*}"
      QUERY=""
      if [ "$DB_AND_QUERY" != "$DB_NAME" ]; then
        QUERY="?${DB_AND_QUERY#*\?}"
      fi

      export SPRING_DATASOURCE_URL="jdbc:postgresql://${HOSTPORT}/${DB_NAME}${QUERY}"
      export SPRING_DATASOURCE_USERNAME="${USERINFO%%:*}"
      export SPRING_DATASOURCE_PASSWORD="${USERINFO#*:}"
      ;;
  esac
fi

exec java -jar /app/app.jar
