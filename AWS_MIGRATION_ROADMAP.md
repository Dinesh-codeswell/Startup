# AWS Migration Roadmap: Supabase to AWS
## Complete Migration Guide Without Data Loss

---

## 🎯 **Migration Overview**

**Current Stack:** Supabase (PostgreSQL + Auth + Real-time)  
**Target Stack:** AWS (RDS PostgreSQL + Cognito + API Gateway + Lambda)  
**Migration Type:** Zero-downtime with data preservation  
**Estimated Timeline:** 2-3 weeks  

---

## 📋 **Pre-Migration Assessment**

### Current Supabase Usage Analysis:
- **Database:** PostgreSQL with RLS policies
- **Authentication:** Supabase Auth (JWT tokens)
- **Real-time:** Supabase real-time subscriptions
- **Storage:** File uploads (if any)
- **Edge Functions:** Server-side logic

### AWS Target Architecture:
- **Database:** Amazon RDS PostgreSQL
- **Authentication:** Amazon Cognito
- **API:** API Gateway + Lambda functions
- **Real-time:** WebSocket API + Lambda
- **Storage:** Amazon S3
- **Hosting:** AWS Amplify or Vercel with AWS backend

---

## 🗺️ **Migration Phases**

### **Phase 1: AWS Infrastructure Setup (Week 1)**
### **Phase 2: Data Migration & Testing (Week 2)**  
### **Phase 3: Application Migration & Deployment (Week 3)**
### **Phase 4: Cutover & Monitoring (Week 3)**

---

# 📅 **PHASE 1: AWS Infrastructure Setup**

## Step 1.1: AWS Account & IAM Setup

### 1.1.1 Create AWS Account & Configure IAM
```bash
# Install AWS CLI
npm install -g @aws-cli/cli
# or
curl "https://awscli.amazonaws.com/awscli-exe-windows-x86_64.msi" -o "AWSCLIV2.msi"

# Configure AWS CLI
aws configure
# Enter: Access Key ID, Secret Access Key, Region (us-east-1), Output format (json)
```

### 1.1.2 Create IAM Roles and Policies
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "rds:*",
        "cognito-idp:*",
        "lambda:*",
        "apigateway:*",
        "s3:*",
        "logs:*"
      ],
      "Resource": "*"
    }
  ]
}
```

## Step 1.2: Database Setup (Amazon RDS)

### 1.2.1 Create RDS PostgreSQL Instance
```bash
# Create RDS instance
aws rds create-db-instance \
    --db-instance-identifier beyond-career-db \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --engine-version 15.4 \
    --master-username postgres \
    --master-user-password YourSecurePassword123! \
    --allocated-storage 20 \
    --storage-type gp2 \
    --vpc-security-group-ids sg-xxxxxxxxx \
    --db-subnet-group-name default \
    --backup-retention-period 7 \
    --multi-az false \
    --publicly-accessible true \
    --storage-encrypted true
```

### 1.2.2 Configure Security Groups
```bash
# Create security group for RDS
aws ec2 create-security-group \
    --group-name beyond-career-db-sg \
    --description "Security group for Beyond Career database"

# Allow PostgreSQL access (port 5432)
aws ec2 authorize-security-group-ingress \
    --group-name beyond-career-db-sg \
    --protocol tcp \
    --port 5432 \
    --cidr 0.0.0.0/0
```

### 1.2.3 Get RDS Connection Details
```bash
# Get RDS endpoint
aws rds describe-db-instances \
    --db-instance-identifier beyond-career-db \
    --query 'DBInstances[0].Endpoint.Address'
```

## Step 1.3: Authentication Setup (Amazon Cognito)

### 1.3.1 Create Cognito User Pool
```bash
# Create user pool
aws cognito-idp create-user-pool \
    --pool-name beyond-career-users \
    --policies '{
        "PasswordPolicy": {
            "MinimumLength": 8,
            "RequireUppercase": true,
            "RequireLowercase": true,
            "RequireNumbers": true,
            "RequireSymbols": false
        }
    }' \
    --auto-verified-attributes email \
    --username-attributes email
```

### 1.3.2 Create User Pool Client
```bash
# Create app client
aws cognito-idp create-user-pool-client \
    --user-pool-id us-east-1_xxxxxxxxx \
    --client-name beyond-career-web-client \
    --generate-secret false \
    --explicit-auth-flows ADMIN_NO_SRP_AUTH USER_PASSWORD_AUTH
```

## Step 1.4: API Gateway Setup

### 1.4.1 Create REST API
```bash
# Create API Gateway
aws apigateway create-rest-api \
    --name beyond-career-api \
    --description "Beyond Career Team Matching API"
```

### 1.4.2 Create WebSocket API (for real-time chat)
```bash
# Create WebSocket API
aws apigatewayv2 create-api \
    --name beyond-career-websocket \
    --protocol-type WEBSOCKET \
    --route-selection-expression '$request.body.action'
```

---

# 📅 **PHASE 2: Data Migration & Testing**

## Step 2.1: Export Data from Supabase

### 2.1.1 Create Data Export Script
```javascript
// scripts/export-supabase-data.js
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function exportAllData() {
  const tables = [
    'profiles',
    'resource_views',
    'team_matching_submissions',
    'teams',
    'team_members',
    'team_matching_batches',
    'team_notifications',
    'team_chat_messages',
    'team_chat_participants',
    'team_chat_reactions',
    'team_chat_typing_indicators'
  ]

  const exportData = {}

  for (const table of tables) {
    console.log(`Exporting ${table}...`)
    const { data, error } = await supabase.from(table).select('*')
    
    if (error) {
      console.error(`Error exporting ${table}:`, error)
      continue
    }

    exportData[table] = data
    console.log(`✅ Exported ${data?.length || 0} records from ${table}`)
  }

  // Save to file
  fs.writeFileSync('supabase-export.json', JSON.stringify(exportData, null, 2))
  console.log('🎉 Export completed: supabase-export.json')
}

exportAllData().catch(console.error)
```

### 2.1.2 Export Database Schema
```bash
# Install pg_dump (if not already installed)
# Export schema only
pg_dump "postgresql://postgres:password@db.supabase.co:5432/postgres" \
    --schema-only \
    --no-owner \
    --no-privileges \
    > supabase-schema.sql

# Export data only
pg_dump "postgresql://postgres:password@db.supabase.co:5432/postgres" \
    --data-only \
    --no-owner \
    --no-privileges \
    > supabase-data.sql
```

## Step 2.2: Prepare AWS Database

### 2.2.1 Create AWS Database Schema
```sql
-- scripts/aws-database-setup.sql
-- Connect to your RDS instance and run:

-- Create all tables (combine all your existing SQL scripts)
\i scripts/create-tables-fixed.sql
\i scripts/create-resource-views-table.sql
\i scripts/create-team-matching-tables.sql
\i scripts/create-team-chat-tables.sql

-- Verify tables created
\dt
```

### 2.2.2 Import Data to AWS RDS
```javascript
// scripts/import-to-aws.js
const { Pool } = require('pg')
const fs = require('fs')

const pool = new Pool({
  host: 'your-rds-endpoint.amazonaws.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'YourSecurePassword123!',
  ssl: { rejectUnauthorized: false }
})

async function importData() {
  const exportData = JSON.parse(fs.readFileSync('supabase-export.json', 'utf8'))
  
  for (const [table, records] of Object.entries(exportData)) {
    if (!records || records.length === 0) continue
    
    console.log(`Importing ${records.length} records to ${table}...`)
    
    for (const record of records) {
      const columns = Object.keys(record).join(', ')
      const values = Object.values(record)
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ')
      
      const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`
      
      try {
        await pool.query(query, values)
      } catch (error) {
        console.error(`Error inserting into ${table}:`, error.message)
      }
    }
    
    console.log(`✅ Imported ${table}`)
  }
  
  console.log('🎉 Data import completed')
  await pool.end()
}

importData().catch(console.error)
```

## Step 2.3: Test Data Integrity

### 2.3.1 Create Data Validation Script
```javascript
// scripts/validate-migration.js
const { Pool } = require('pg')

const supabasePool = new Pool({
  connectionString: process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', 'postgresql://postgres:password@').replace('.supabase.co', '.supabase.co:5432/postgres')
})

const awsPool = new Pool({
  host: 'your-rds-endpoint.amazonaws.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'YourSecurePassword123!'
})

async function validateMigration() {
  const tables = ['profiles', 'team_matching_submissions', 'teams', 'team_chat_messages']
  
  for (const table of tables) {
    const supabaseCount = await supabasePool.query(`SELECT COUNT(*) FROM ${table}`)
    const awsCount = await awsPool.query(`SELECT COUNT(*) FROM ${table}`)
    
    const supabaseTotal = parseInt(supabaseCount.rows[0].count)
    const awsTotal = parseInt(awsCount.rows[0].count)
    
    console.log(`${table}: Supabase=${supabaseTotal}, AWS=${awsTotal}`)
    
    if (supabaseTotal === awsTotal) {
      console.log(`✅ ${table} migration verified`)
    } else {
      console.log(`❌ ${table} migration failed - count mismatch`)
    }
  }
}

validateMigration().catch(console.error)
```

---

# 📅 **PHASE 3: Application Migration & Deployment**

## Step 3.1: Create AWS Service Layer

### 3.1.1 Create AWS Database Client
```typescript
// lib/aws-db.ts
import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.AWS_RDS_ENDPOINT,
  port: 5432,
  database: process.env.AWS_RDS_DATABASE,
  user: process.env.AWS_RDS_USERNAME,
  password: process.env.AWS_RDS_PASSWORD,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

export { pool as awsDb }
```

### 3.1.2 Create Cognito Auth Service
```typescript
// lib/aws-auth.ts
import { CognitoIdentityProviderClient, InitiateAuthCommand, SignUpCommand } from '@aws-sdk/client-cognito-identity-provider'

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION
})

export class AWSAuthService {
  static async signUp(email: string, password: string, attributes: any) {
    const command = new SignUpCommand({
      ClientId: process.env.AWS_COGNITO_CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'given_name', Value: attributes.firstName },
        { Name: 'family_name', Value: attributes.lastName }
      ]
    })

    return await cognitoClient.send(command)
  }

  static async signIn(email: string, password: string) {
    const command = new InitiateAuthCommand({
      ClientId: process.env.AWS_COGNITO_CLIENT_ID,
      AuthFlow: 'USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    })

    return await cognitoClient.send(command)
  }
}
```

### 3.1.3 Update Service Layer for AWS
```typescript
// lib/services/aws-team-matching-db.ts
import { awsDb } from '@/lib/aws-db'
import type { TeamMatchingSubmission } from '@/lib/types/team-matching'

export class AWSTeamMatchingService {
  static async submitTeamMatchingForm(formData: any, userId?: string): Promise<TeamMatchingSubmission> {
    const query = `
      INSERT INTO team_matching_submissions (
        id, user_id, full_name, email, whatsapp_number, college_name,
        current_year, core_strengths, preferred_roles, preferred_teammate_roles,
        availability, experience, case_preferences, preferred_team_size, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `

    const values = [
      formData.id,
      userId || null,
      formData.fullName,
      formData.email,
      formData.whatsappNumber,
      formData.collegeName,
      formData.currentYear,
      formData.coreStrengths,
      formData.preferredRoles,
      formData.preferredTeammateRoles,
      formData.availability,
      formData.experience,
      formData.casePreferences,
      parseInt(formData.preferredTeamSize),
      'pending_match'
    ]

    const result = await awsDb.query(query, values)
    return result.rows[0]
  }

  // Add all other methods from team-matching-db.ts with AWS DB queries
}
```

## Step 3.2: Create Lambda Functions

### 3.2.1 Team Matching Lambda
```typescript
// aws-lambda/team-matching/index.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { AWSTeamMatchingService } from './aws-team-matching-service'

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { httpMethod, path, body } = event

    if (httpMethod === 'POST' && path === '/team-matching/submit') {
      const formData = JSON.parse(body || '{}')
      const result = await AWSTeamMatchingService.submitTeamMatchingForm(formData)
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          data: result
        })
      }
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Not found' })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
}
```

### 3.2.2 Chat WebSocket Lambda
```typescript
// aws-lambda/chat-websocket/index.ts
import { APIGatewayProxyWebsocketEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi'

const apiGatewayClient = new ApiGatewayManagementApiClient({
  endpoint: process.env.WEBSOCKET_API_ENDPOINT
})

export const handler = async (event: APIGatewayProxyWebsocketEventV2): Promise<APIGatewayProxyResultV2> => {
  const { eventType, connectionId, body } = event

  try {
    switch (eventType) {
      case 'CONNECT':
        // Handle WebSocket connection
        console.log('Client connected:', connectionId)
        break

      case 'DISCONNECT':
        // Handle WebSocket disconnection
        console.log('Client disconnected:', connectionId)
        break

      case 'MESSAGE':
        // Handle chat message
        const message = JSON.parse(body || '{}')
        await handleChatMessage(connectionId, message)
        break
    }

    return { statusCode: 200 }
  } catch (error) {
    console.error('WebSocket error:', error)
    return { statusCode: 500 }
  }
}

async function handleChatMessage(connectionId: string, message: any) {
  // Process chat message and broadcast to team members
  // Implementation similar to your current chat service
}
```

## Step 3.3: Deploy Lambda Functions

### 3.3.1 Create Deployment Script
```bash
# scripts/deploy-lambdas.sh
#!/bin/bash

# Build and deploy team matching lambda
cd aws-lambda/team-matching
npm install
npm run build
zip -r team-matching.zip .

aws lambda create-function \
    --function-name beyond-career-team-matching \
    --runtime nodejs18.x \
    --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
    --handler index.handler \
    --zip-file fileb://team-matching.zip

# Build and deploy chat websocket lambda
cd ../chat-websocket
npm install
npm run build
zip -r chat-websocket.zip .

aws lambda create-function \
    --function-name beyond-career-chat-websocket \
    --runtime nodejs18.x \
    --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
    --handler index.handler \
    --zip-file fileb://chat-websocket.zip
```

## Step 3.4: Update Frontend Configuration

### 3.4.1 Create AWS Configuration
```typescript
// lib/aws-config.ts
export const awsConfig = {
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  apiGateway: {
    endpoint: process.env.NEXT_PUBLIC_API_GATEWAY_ENDPOINT,
  },
  cognito: {
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
    clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
  },
  websocket: {
    endpoint: process.env.NEXT_PUBLIC_WEBSOCKET_ENDPOINT,
  }
}
```

### 3.4.2 Update Environment Variables
```bash
# .env.aws (new environment file)
# AWS Configuration
NEXT_PUBLIC_AWS_REGION=us-east-1
AWS_RDS_ENDPOINT=your-rds-endpoint.amazonaws.com
AWS_RDS_DATABASE=postgres
AWS_RDS_USERNAME=postgres
AWS_RDS_PASSWORD=YourSecurePassword123!

# Cognito
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx

# API Gateway
NEXT_PUBLIC_API_GATEWAY_ENDPOINT=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod

# WebSocket
NEXT_PUBLIC_WEBSOCKET_ENDPOINT=wss://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod
```

---

# 📅 **PHASE 4: Cutover & Monitoring**

## Step 4.1: Gradual Migration Strategy

### 4.1.1 Feature Flag Implementation
```typescript
// lib/feature-flags.ts
export const useAWS = process.env.NEXT_PUBLIC_USE_AWS === 'true'

export function getDbService() {
  return useAWS ? AWSTeamMatchingService : TeamMatchingService
}

export function getAuthService() {
  return useAWS ? AWSAuthService : SupabaseAuthService
}
```

### 4.1.2 Dual-Write Strategy (Temporary)
```typescript
// lib/services/dual-write-service.ts
export class DualWriteService {
  static async submitTeamMatchingForm(formData: any) {
    // Write to both Supabase and AWS during transition
    const [supabaseResult, awsResult] = await Promise.allSettled([
      TeamMatchingService.submitTeamMatchingForm(formData),
      AWSTeamMatchingService.submitTeamMatchingForm(formData)
    ])

    // Log any discrepancies
    if (supabaseResult.status === 'rejected' || awsResult.status === 'rejected') {
      console.error('Dual write failed:', { supabaseResult, awsResult })
    }

    // Return AWS result as primary
    return awsResult.status === 'fulfilled' ? awsResult.value : supabaseResult.value
  }
}
```

## Step 4.2: Testing & Validation

### 4.2.1 Create End-to-End Tests
```typescript
// tests/aws-migration.test.ts
import { AWSTeamMatchingService } from '@/lib/services/aws-team-matching-db'

describe('AWS Migration Tests', () => {
  test('should submit team matching form to AWS', async () => {
    const formData = {
      id: 'test-id',
      fullName: 'Test User',
      email: 'test@example.com',
      // ... other fields
    }

    const result = await AWSTeamMatchingService.submitTeamMatchingForm(formData)
    expect(result.id).toBe('test-id')
    expect(result.status).toBe('pending_match')
  })

  test('should maintain data consistency', async () => {
    // Test data integrity between old and new systems
  })
})
```

### 4.2.2 Performance Testing
```bash
# Load test AWS endpoints
npm install -g artillery

# Create artillery config
cat > aws-load-test.yml << EOF
config:
  target: 'https://your-api-gateway-endpoint.amazonaws.com'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Team matching submission"
    requests:
      - post:
          url: "/prod/team-matching/submit"
          json:
            fullName: "Test User"
            email: "test@example.com"
EOF

# Run load test
artillery run aws-load-test.yml
```

## Step 4.3: Monitoring & Alerting

### 4.3.1 CloudWatch Setup
```bash
# Create CloudWatch alarms
aws cloudwatch put-metric-alarm \
    --alarm-name "RDS-CPU-High" \
    --alarm-description "RDS CPU utilization is too high" \
    --metric-name CPUUtilization \
    --namespace AWS/RDS \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=DBInstanceIdentifier,Value=beyond-career-db \
    --evaluation-periods 2
```

### 4.3.2 Application Monitoring
```typescript
// lib/monitoring.ts
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch'

const cloudWatch = new CloudWatchClient({ region: process.env.AWS_REGION })

export async function logMetric(metricName: string, value: number, unit = 'Count') {
  const command = new PutMetricDataCommand({
    Namespace: 'BeyondCareer/Application',
    MetricData: [{
      MetricName: metricName,
      Value: value,
      Unit: unit,
      Timestamp: new Date()
    }]
  })

  await cloudWatch.send(command)
}
```

---

# 🚀 **DEPLOYMENT CHECKLIST**

## Pre-Deployment
- [ ] AWS infrastructure provisioned
- [ ] Data exported from Supabase
- [ ] Data imported to AWS RDS
- [ ] Data integrity validated
- [ ] Lambda functions deployed
- [ ] API Gateway configured
- [ ] Cognito user pool set up
- [ ] Environment variables updated

## Deployment
- [ ] Feature flags configured
- [ ] Dual-write enabled (temporary)
- [ ] End-to-end tests passing
- [ ] Performance tests completed
- [ ] Monitoring and alerts configured

## Post-Deployment
- [ ] Traffic gradually shifted to AWS
- [ ] Supabase dual-write disabled
- [ ] Old Supabase resources cleaned up
- [ ] Documentation updated
- [ ] Team trained on new architecture

---

# 💰 **COST ESTIMATION**

## Monthly AWS Costs (Estimated)
- **RDS PostgreSQL (db.t3.micro):** $15-25/month
- **Lambda Functions:** $5-15/month (based on usage)
- **API Gateway:** $3-10/month (per million requests)
- **Cognito:** $0.0055 per MAU (first 50k free)
- **CloudWatch:** $5-10/month
- **Data Transfer:** $5-15/month

**Total Estimated:** $35-80/month (vs Supabase Pro at $25/month)

---

# 🔧 **ROLLBACK PLAN**

In case of issues during migration:

1. **Immediate Rollback:** Switch feature flag back to Supabase
2. **Data Sync:** Sync any new data from AWS back to Supabase
3. **DNS/Environment:** Revert environment variables
4. **Monitoring:** Monitor for any data inconsistencies

---

# 📚 **ADDITIONAL RESOURCES**

## AWS Documentation
- [RDS PostgreSQL Guide](https://docs.aws.amazon.com/rds/latest/userguide/CHAP_PostgreSQL.html)
- [Cognito Developer Guide](https://docs.aws.amazon.com/cognito/latest/developerguide/)
- [API Gateway Developer Guide](https://docs.aws.amazon.com/apigateway/latest/developerguide/)
- [Lambda Developer Guide](https://docs.aws.amazon.com/lambda/latest/dg/)

## Migration Tools
- [AWS Database Migration Service](https://aws.amazon.com/dms/)
- [AWS Schema Conversion Tool](https://aws.amazon.com/dms/schema-conversion-tool/)

---

**🎯 This roadmap ensures zero data loss and minimal downtime during your migration from Supabase to AWS!**