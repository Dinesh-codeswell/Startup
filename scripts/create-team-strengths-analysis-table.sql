-- =====================================================
-- TEAM STRENGTHS ANALYSIS TABLE
-- =====================================================
-- This table stores calculated team analysis results to avoid repetitive calculations

CREATE TABLE IF NOT EXISTS team_strengths_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Team Complementarity Score
  complementarity_score INTEGER NOT NULL CHECK (complementarity_score >= 0 AND complementarity_score <= 100),
  complementarity_description TEXT NOT NULL,
  key_observations TEXT[],
  
  -- Skill Coverage by Domain (percentages)
  consulting_coverage DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (consulting_coverage >= 0 AND consulting_coverage <= 100),
  technology_coverage DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (technology_coverage >= 0 AND technology_coverage <= 100),
  finance_coverage DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (finance_coverage >= 0 AND finance_coverage <= 100),
  marketing_coverage DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (marketing_coverage >= 0 AND marketing_coverage <= 100),
  design_coverage DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (design_coverage >= 0 AND design_coverage <= 100),
  
  -- Detailed Analysis Components
  breadth_coverage_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  domain_distribution_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  essential_skills_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  redundancy_optimization_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  
  -- Metadata
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  team_member_count INTEGER NOT NULL,
  core_strengths_analyzed TEXT[] NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_strengths_analysis_team_id ON team_strengths_analysis(team_id);
CREATE INDEX IF NOT EXISTS idx_team_strengths_analysis_calculated_at ON team_strengths_analysis(calculated_at);

-- Create trigger for updated_at
CREATE TRIGGER update_team_strengths_analysis_updated_at
  BEFORE UPDATE ON team_strengths_analysis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON team_strengths_analysis TO authenticated;

-- =====================================================
-- HELPER FUNCTIONS FOR TEAM STRENGTHS ANALYSIS
-- =====================================================

-- Function to get team members with their core strengths
CREATE OR REPLACE FUNCTION get_team_core_strengths(p_team_id UUID)
RETURNS TABLE(
  member_id UUID,
  member_name TEXT,
  core_strengths TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tm.submission_id as member_id,
    tms.full_name as member_name,
    tms.core_strengths
  FROM team_members tm
  JOIN team_matching_submissions tms ON tm.submission_id = tms.id
  WHERE tm.team_id = p_team_id
    AND tms.status = 'team_formed';
END;
$$ LANGUAGE plpgsql;

-- Function to calculate skill coverage by domain
CREATE OR REPLACE FUNCTION calculate_skill_coverage_by_domain(
  p_team_id UUID,
  OUT consulting_coverage DECIMAL,
  OUT technology_coverage DECIMAL,
  OUT finance_coverage DECIMAL,
  OUT marketing_coverage DECIMAL,
  OUT design_coverage DECIMAL
) AS $$
DECLARE
  team_size INTEGER;
  consulting_members INTEGER := 0;
  technology_members INTEGER := 0;
  finance_members INTEGER := 0;
  marketing_members INTEGER := 0;
  design_members INTEGER := 0;
  member_record RECORD;
BEGIN
  -- Get team size
  SELECT COUNT(*) INTO team_size
  FROM team_members tm
  JOIN team_matching_submissions tms ON tm.submission_id = tms.id
  WHERE tm.team_id = p_team_id AND tms.status = 'team_formed';
  
  IF team_size = 0 THEN
    consulting_coverage := 0;
    technology_coverage := 0;
    finance_coverage := 0;
    marketing_coverage := 0;
    design_coverage := 0;
    RETURN;
  END IF;
  
  -- Count members with strengths in each domain
  FOR member_record IN 
    SELECT tms.core_strengths
    FROM team_members tm
    JOIN team_matching_submissions tms ON tm.submission_id = tms.id
    WHERE tm.team_id = p_team_id AND tms.status = 'team_formed'
  LOOP
    -- Consulting: Strategy, Research, Management, Presentation, Pitching
    IF member_record.core_strengths && ARRAY['Strategy', 'Research', 'Management', 'Presentation', 'Pitching'] THEN
      consulting_members := consulting_members + 1;
    END IF;
    
    -- Technology: Technical, UI/UX, Research
    IF member_record.core_strengths && ARRAY['Technical', 'UI/UX', 'Research'] THEN
      technology_members := technology_members + 1;
    END IF;
    
    -- Finance: Financial, Research, Strategy
    IF member_record.core_strengths && ARRAY['Financial', 'Research', 'Strategy'] THEN
      finance_members := finance_members + 1;
    END IF;
    
    -- Marketing: Market, Pitching, Presentation, Ideation
    IF member_record.core_strengths && ARRAY['Market', 'Pitching', 'Presentation', 'Ideation'] THEN
      marketing_members := marketing_members + 1;
    END IF;
    
    -- Design: UI/UX, Ideation, Presentation
    IF member_record.core_strengths && ARRAY['UI/UX', 'Ideation', 'Presentation'] THEN
      design_members := design_members + 1;
    END IF;
  END LOOP;
  
  -- Calculate percentages
  consulting_coverage := (consulting_members::DECIMAL / team_size) * 100;
  technology_coverage := (technology_members::DECIMAL / team_size) * 100;
  finance_coverage := (finance_members::DECIMAL / team_size) * 100;
  marketing_coverage := (marketing_members::DECIMAL / team_size) * 100;
  design_coverage := (design_members::DECIMAL / team_size) * 100;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate team complementarity score
CREATE OR REPLACE FUNCTION calculate_team_complementarity(
  p_team_id UUID,
  OUT complementarity_score INTEGER,
  OUT description TEXT,
  OUT breadth_score DECIMAL,
  OUT distribution_score DECIMAL,
  OUT essential_score DECIMAL,
  OUT redundancy_score DECIMAL
) AS $$
DECLARE
  all_strengths TEXT[];
  unique_strengths TEXT[];
  team_size INTEGER;
  essential_skills TEXT[] := ARRAY['Strategy', 'Research', 'Financial', 'Presentation'];
  essential_count INTEGER := 0;
  domain_counts INTEGER[] := ARRAY[0,0,0,0,0]; -- consulting, technology, finance, marketing, design
  member_record RECORD;
  domain_variance DECIMAL;
  avg_domain_coverage DECIMAL;
BEGIN
  -- Get all core strengths from team members
  SELECT array_agg(DISTINCT unnest_strengths) INTO unique_strengths
  FROM (
    SELECT unnest(tms.core_strengths) as unnest_strengths
    FROM team_members tm
    JOIN team_matching_submissions tms ON tm.submission_id = tms.id
    WHERE tm.team_id = p_team_id AND tms.status = 'team_formed'
  ) subq;
  
  -- Get team size
  SELECT COUNT(*) INTO team_size
  FROM team_members tm
  JOIN team_matching_submissions tms ON tm.submission_id = tms.id
  WHERE tm.team_id = p_team_id AND tms.status = 'team_formed';
  
  IF team_size = 0 OR unique_strengths IS NULL THEN
    complementarity_score := 0;
    description := 'No team data available';
    breadth_score := 0;
    distribution_score := 0;
    essential_score := 0;
    redundancy_score := 0;
    RETURN;
  END IF;
  
  -- 1. Breadth Coverage (40% weight): Count unique strengths out of 10 possible
  breadth_score := (array_length(unique_strengths, 1)::DECIMAL / 10) * 40;
  
  -- 2. Essential Skills Coverage (20% weight): Check for Strategy, Research, Financial, Presentation
  SELECT COUNT(*) INTO essential_count
  FROM unnest(essential_skills) skill
  WHERE skill = ANY(unique_strengths);
  
  essential_score := (essential_count::DECIMAL / 4) * 20;
  
  -- 3. Domain Distribution Balance (30% weight): Calculate domain coverage variance
  FOR member_record IN 
    SELECT tms.core_strengths
    FROM team_members tm
    JOIN team_matching_submissions tms ON tm.submission_id = tms.id
    WHERE tm.team_id = p_team_id AND tms.status = 'team_formed'
  LOOP
    -- Count domain coverage
    IF member_record.core_strengths && ARRAY['Strategy', 'Research', 'Management', 'Presentation', 'Pitching'] THEN
      domain_counts[1] := domain_counts[1] + 1;
    END IF;
    IF member_record.core_strengths && ARRAY['Technical', 'UI/UX', 'Research'] THEN
      domain_counts[2] := domain_counts[2] + 1;
    END IF;
    IF member_record.core_strengths && ARRAY['Financial', 'Research', 'Strategy'] THEN
      domain_counts[3] := domain_counts[3] + 1;
    END IF;
    IF member_record.core_strengths && ARRAY['Market', 'Pitching', 'Presentation', 'Ideation'] THEN
      domain_counts[4] := domain_counts[4] + 1;
    END IF;
    IF member_record.core_strengths && ARRAY['UI/UX', 'Ideation', 'Presentation'] THEN
      domain_counts[5] := domain_counts[5] + 1;
    END IF;
  END LOOP;
  
  -- Calculate distribution balance (lower variance = better balance)
  avg_domain_coverage := (domain_counts[1] + domain_counts[2] + domain_counts[3] + domain_counts[4] + domain_counts[5])::DECIMAL / 5;
  domain_variance := (
    power(domain_counts[1] - avg_domain_coverage, 2) +
    power(domain_counts[2] - avg_domain_coverage, 2) +
    power(domain_counts[3] - avg_domain_coverage, 2) +
    power(domain_counts[4] - avg_domain_coverage, 2) +
    power(domain_counts[5] - avg_domain_coverage, 2)
  ) / 5;
  
  -- Convert variance to score (lower variance = higher score)
  distribution_score := GREATEST(0, 30 - (domain_variance * 5));
  
  -- 4. Redundancy Optimization (10% weight): Efficiency without excessive overlap
  redundancy_score := CASE 
    WHEN array_length(unique_strengths, 1) >= team_size THEN 10
    ELSE (array_length(unique_strengths, 1)::DECIMAL / team_size) * 10
  END;
  
  -- Calculate final score
  complementarity_score := ROUND(breadth_score + distribution_score + essential_score + redundancy_score);
  
  -- Generate description based on score
  description := CASE 
    WHEN complementarity_score >= 90 THEN 'Exceptional team balance with comprehensive skill coverage'
    WHEN complementarity_score >= 80 THEN 'Excellent balance between strategic, analytical, creative, and technical skills'
    WHEN complementarity_score >= 70 THEN 'Good team composition with solid skill coverage'
    WHEN complementarity_score >= 60 THEN 'Adequate team balance with some skill gaps'
    ELSE 'Team composition needs improvement for better skill coverage'
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate and store team strengths analysis
CREATE OR REPLACE FUNCTION calculate_and_store_team_analysis(p_team_id UUID)
RETURNS UUID AS $$
DECLARE
  analysis_id UUID;
  coverage_result RECORD;
  complementarity_result RECORD;
  team_member_count INTEGER;
  all_core_strengths TEXT[];
BEGIN
  -- Get team member count and all core strengths
  SELECT 
    COUNT(*),
    array_agg(DISTINCT unnest_strengths)
  INTO 
    team_member_count,
    all_core_strengths
  FROM (
    SELECT unnest(tms.core_strengths) as unnest_strengths
    FROM team_members tm
    JOIN team_matching_submissions tms ON tm.submission_id = tms.id
    WHERE tm.team_id = p_team_id AND tms.status = 'team_formed'
  ) subq;
  
  -- Calculate skill coverage by domain
  SELECT * INTO coverage_result
  FROM calculate_skill_coverage_by_domain(p_team_id);
  
  -- Calculate team complementarity
  SELECT * INTO complementarity_result
  FROM calculate_team_complementarity(p_team_id);
  
  -- Delete existing analysis for this team
  DELETE FROM team_strengths_analysis WHERE team_id = p_team_id;
  
  -- Insert new analysis
  INSERT INTO team_strengths_analysis (
    team_id,
    complementarity_score,
    complementarity_description,
    key_observations,
    consulting_coverage,
    technology_coverage,
    finance_coverage,
    marketing_coverage,
    design_coverage,
    breadth_coverage_score,
    domain_distribution_score,
    essential_skills_score,
    redundancy_optimization_score,
    team_member_count,
    core_strengths_analyzed
  ) VALUES (
    p_team_id,
    complementarity_result.complementarity_score,
    complementarity_result.description,
    ARRAY['Calculated from ' || team_member_count || ' team members', 'Based on ' || array_length(all_core_strengths, 1) || ' unique strengths'],
    coverage_result.consulting_coverage,
    coverage_result.technology_coverage,
    coverage_result.finance_coverage,
    coverage_result.marketing_coverage,
    coverage_result.design_coverage,
    complementarity_result.breadth_score,
    complementarity_result.distribution_score,
    complementarity_result.essential_score,
    complementarity_result.redundancy_score,
    team_member_count,
    all_core_strengths
  ) RETURNING id INTO analysis_id;
  
  RETURN analysis_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_team_core_strengths(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_skill_coverage_by_domain(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_team_complementarity(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_and_store_team_analysis(UUID) TO authenticated;

COMMIT;