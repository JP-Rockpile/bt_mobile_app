#!/bin/bash

echo "================================"
echo "Running Project Verification"
echo "================================"
echo ""

# Check TypeScript
echo "1. Checking TypeScript..."
npm run type-check
TS_EXIT=$?

if [ $TS_EXIT -eq 0 ]; then
    echo "✅ TypeScript check passed"
else
    echo "❌ TypeScript check failed"
fi
echo ""

# Check Linting
echo "2. Checking ESLint..."
npm run lint
LINT_EXIT=$?

if [ $LINT_EXIT -eq 0 ]; then
    echo "✅ Linting passed"
else
    echo "❌ Linting failed"
fi
echo ""

# Check for version conflicts
echo "3. Checking for package version conflicts..."
npx expo-doctor
DOCTOR_EXIT=$?

if [ $DOCTOR_EXIT -eq 0 ]; then
    echo "✅ No version conflicts detected"
else
    echo "⚠️  Some version warnings (check above)"
fi
echo ""

# Summary
echo "================================"
echo "Verification Summary"
echo "================================"

if [ $TS_EXIT -eq 0 ] && [ $LINT_EXIT -eq 0 ]; then
    echo "✅ All checks passed! Your project is ready."
    exit 0
else
    echo "❌ Some checks failed. Please review the errors above."
    exit 1
fi


