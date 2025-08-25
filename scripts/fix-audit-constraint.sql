-- Fix audit constraint issue for team creation
-- The audit function generates 'teams_created' but constraint expects 'team_created'

-- Option 1: Update the constraint to allow the generated action names
ALTER TABLE team_formation_audit DROP CONSTRAINT IF EXISTS team_formation_audit_action_check;

ALTER TABLE team_formation_audit ADD CONSTRAINT team_formation_audit_action_check 
CHECK (action IN (
  'team_created', 'team_approved', 'team_rejected', 'member_added', 'member_removed', 'status_changed',
  'teams_created', 'teams_updated', 'teams_deleted',
  'team_members_created', 'team_members_updated', 'team_members_deleted'
));

-- Option 2: Alternative - Create a better audit function that maps table names correctly
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $
DECLARE
  action_type TEXT;
  old_data JSONB;
  new_data JSONB;
BEGIN
  -- Determine action type with proper mapping
  IF TG_OP = 'INSERT' THEN
    CASE TG_TABLE_NAME
      WHEN 'teams' THEN action_type := 'team_created';
      WHEN 'team_members' THEN action_type := 'member_added';
      ELSE action_type := TG_TABLE_NAME || '_created';
    END CASE;
    old_data := NULL;
    new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    CASE TG_TABLE_NAME
      WHEN 'teams' THEN action_type := 'status_changed';
      WHEN 'team_members' THEN action_type := 'member_added';
      ELSE action_type := TG_TABLE_NAME || '_updated';
    END CASE;
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    CASE TG_TABLE_NAME
      WHEN 'teams' THEN action_type := 'team_rejected';
      WHEN 'team_members' THEN action_type := 'member_removed';
      ELSE action_type := TG_TABLE_NAME || '_deleted';
    END CASE;
    old_data := to_jsonb(OLD);
    new_data := NULL;
  END IF;

  -- Insert audit log entry
  INSERT INTO team_formation_audit (
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    admin_user_id
  ) VALUES (
    action_type,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    old_data,
    new_data,
    CASE 
      WHEN auth.jwt() ->> 'role' = 'service_role' THEN auth.uid()
      ELSE NULL
    END
  );

  RETURN COALESCE(NEW, OLD);
END;
$ LANGUAGE plpgsql SECURITY DEFINER;