#!/bin/bash
set -e

for DB in rh_auth rh_personnel rh_commission rh_presence; do
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE $DB;
EOSQL
done
