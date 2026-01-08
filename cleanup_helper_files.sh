#!/bin/bash
# Cleanup Helper Files Script
# Removes all debug/helper files created during troubleshooting

echo "🧹 Cleaning up helper files..."
echo ""

# List of files to remove
files_to_remove=(
    "add_admin_fields.sql"
    "ADMIN_FEATURES.md"
    "check_existing_tables.sql"
    "COMPLETE_FIX_GUIDE.md"
    "complete_user_table.sql"
    "create_all_tables.sql"
    "DATA_FLOW_VERIFICATION.md"
    "database_migration.sql"
    "database_setup.sql"
    "DATABASE_SETUP_GUIDE.md"
    "database-schema.sql"
    "fix_missing_fields.sql"
    "fix_user_table_for_prisma.sql"
    "make_admin.sql"
    "MANUAL_USER_SETUP.md"
    "MVP_LAUNCH_CHECKLIST.md"
    "PRISMA_MIGRATION_ISSUES.md"
    "PROFILE_PAGE_DEBUG.md"
    "QUICK_FIX_GUIDE.md"
    "SCHEMA_DIFFERENCES.md"
    "step1_create_user_table.sql"
    "step1_update_user_table.sql"
    "step2_create_job_table.sql"
    "step2_update_existing_job_table.sql"
    "step2_update_job_table.sql"
    "step3_create_subscription_tables.sql"
    "step4_create_analytics_tables.sql"
    "step5_fixed_default_data.sql"
    "step5_insert_default_data.sql"
    "verify_user_table_columns.sql"
)

removed_count=0
not_found_count=0

for file in "${files_to_remove[@]}"; do
    if [ -f "$file" ]; then
        rm "$file"
        echo "✅ Removed: $file"
        ((removed_count++))
    else
        echo "⏭️  Not found: $file"
        ((not_found_count++))
    fi
done

echo ""
echo "========================================="
echo "🎉 Cleanup complete!"
echo "  Removed: $removed_count files"
echo "  Not found: $not_found_count files"
echo ""
echo "Keeping these essential files:"
echo "  ✅ README.md"
echo "  ✅ DEPLOYMENT_READY.md"
echo "  ✅ FINAL_DATABASE_FIX.sql"
echo "  ✅ .env (if exists)"
echo "  ✅ .env.example"
echo "========================================="
