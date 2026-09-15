#!/usr/bin/env bash
set -euo pipefail

# Sometimes, the databases from opti contain extremely large tables with junk.
# This script removes this junk saving massive amounts of gigabytes of space when rolling local db.
# It renames the .bacpac file to .zip, unzips it, removes the junk tables, zips the result and renames back to .bacpac.

# Usage:
#   ./clean-bacpac.sh
#   ./clean-bacpac.sh "MyDatabase.bacpac"

input_file="${1:-}"

if [[ -z "${input_file}" ]]; then
  read -r -p "Enter .bacpac file name (e.g. MyDb.bacpac): " input_file
fi

if [[ "${input_file}" != *.bacpac ]]; then
  echo "Error: file must end with .bacpac"
  exit 1
fi

if [[ ! -f "${input_file}" ]]; then
  echo "Error: file not found: ${input_file}"
  exit 1
fi

base_name="$(basename "${input_file}" .bacpac)"
work_dir="${base_name}__extracted"
output_zip="${base_name}_clean.zip"
output_bacpac="${base_name}_clean.bacpac"

# Safety checks
if [[ -e "${work_dir}" || -e "${output_zip}" || -e "${output_bacpac}" ]]; then
  echo "Error: output/work files already exist. Remove these first:"
  echo "  ${work_dir}"
  echo "  ${output_zip}"
  echo "  ${output_bacpac}"
  exit 1
fi

echo "Extracting ${input_file}..."
mkdir -p "${work_dir}"
unzip -q "${input_file}" -d "${work_dir}"

target_dir="${work_dir}/Data/dbo.SecurityReportTo"
if [[ -d "${target_dir}" ]]; then
  echo "Deleting ${target_dir}..."
  rm -rf "${target_dir}"
else
  echo "Error: required directory not found: ${target_dir}"
  exit 1
fi

echo "Creating new zip from extracted contents..."
(
  cd "${work_dir}"
  zip -qr "../${output_zip}" .
)

echo "Renaming zip to bacpac..."
mv "${output_zip}" "${output_bacpac}"

echo "Cleaning up..."
rm -rf "${work_dir}"
rm -f "${input_file}"

echo "Done. New clean bacpac: ${output_bacpac}"