#!/bin/bash

# SmartFlowPro - Create Admin User Script
# This script creates a new user with proper metadata via Supabase CLI

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== SmartFlowPro User Creation ===${NC}\n"

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}Supabase CLI is not installed.${NC}"
    echo "Install it with: brew install supabase/tap/supabase"
    exit 1
fi

# Prompt for user details
read -p "Enter email: " EMAIL
read -sp "Enter password: " PASSWORD
echo ""
read -p "Enter full name: " FULL_NAME
read -p "Enter organization ID (UUID): " ORG_ID

# Prompt for role
echo "Select role:"
echo "1) admin"
echo "2) dispatcher"
echo "3) accountant"
echo "4) technician"
read -p "Enter choice (1-4): " ROLE_CHOICE

case $ROLE_CHOICE in
    1) ROLE="admin" ;;
    2) ROLE="dispatcher" ;;
    3) ROLE="accountant" ;;
    4) ROLE="technician" ;;
    *) echo -e "${RED}Invalid choice${NC}"; exit 1 ;;
esac

echo -e "\n${BLUE}Creating user...${NC}"

# Create user via Supabase CLI
supabase db execute --project-ref pbqbsdmwbjpsvxuuwjiv <<SQL
-- Create auth user with metadata
SELECT auth.create_user(
  email := '$EMAIL',
  password := '$PASSWORD',
  user_metadata := jsonb_build_object(
    'full_name', '$FULL_NAME',
    'org_id', '$ORG_ID',
    'role', '$ROLE'
  )
);
SQL

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ User created successfully!${NC}"
    echo -e "\nUser details:"
    echo -e "  Email: $EMAIL"
    echo -e "  Name: $FULL_NAME"
    echo -e "  Role: $ROLE"
    echo -e "  Org ID: $ORG_ID"
else
    echo -e "${RED}✗ Failed to create user${NC}"
    exit 1
fi
