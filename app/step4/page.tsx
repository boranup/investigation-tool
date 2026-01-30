// Add this to your Step 4 component to check for existing assessments

// Near the top of your component, add state for assessments
const [hopAssessments, setHopAssessments] = useState<any>({});
const [hfatAssessments, setHfatAssessments] = useState<any>({});

// Add this function to load assessments for all causal factors
async function loadAssessments() {
  try {
    // Get all causal factors for this investigation
    const { data: factors } = await supabase
      .from('causal_factors')
      .select('id')
      .eq('investigation_id', investigationId);

    if (!factors) return;

    const factorIds = factors.map(f => f.id);

    // Load all HOP assessments
    const { data: hopData } = await supabase
      .from('hop_assessments')
      .select('*')
      .in('causal_factor_id', factorIds);

    // Load all HFAT assessments  
    const { data: hfatData } = await supabase
      .from('hfat_assessments')
      .select('*')
      .in('causal_factor_id', factorIds);

    // Group by causal_factor_id
    const hopMap: any = {};
    hopData?.forEach((assessment: any) => {
      if (!hopMap[assessment.causal_factor_id]) {
        hopMap[assessment.causal_factor_id] = [];
      }
      hopMap[assessment.causal_factor_id].push(assessment);
    });

    const hfatMap: any = {};
    hfatData?.forEach((assessment: any) => {
      if (!hfatMap[assessment.causal_factor_id]) {
        hfatMap[assessment.causal_factor_id] = [];
      }
      hfatMap[assessment.causal_factor_id].push(assessment);
    });

    setHopAssessments(hopMap);
    setHfatAssessments(hfatMap);
  } catch (error) {
    console.error('Error loading assessments:', error);
  }
}

// Call loadAssessments in your useEffect
useEffect(() => {
  loadInvestigation();
  loadAssessments(); // Add this line
}, [investigationId]);

// Replace your "Launch HOP" button with this:
{/* HOP Assessment Section */}
<div className="mt-3 pt-3 border-t">
  <div className="flex items-center justify-between mb-2">
    <h4 className="font-medium text-sm">HOP Assessment</h4>
    {hopAssessments[factor.id]?.length > 0 && (
      <span className="text-xs text-green-600">
        {hopAssessments[factor.id].length} assessment(s)
      </span>
    )}
  </div>

  {hopAssessments[factor.id]?.map((assessment: any) => (
    <div key={assessment.id} className="mb-2 p-2 bg-green-50 rounded border border-green-200">
      <div className="flex items-center justify-between">
        <div className="text-xs">
          <div className="font-medium">
            {assessment.action_type === 'error' ? 'Error Analysis' : 'Violation Analysis'}
          </div>
          <div className="text-gray-600">
            {assessment.status === 'complete' ? 'Complete' : 'Draft'} - 
            {new Date(assessment.updated_at).toLocaleDateString()}
          </div>
        </div>
        <button
          onClick={() => router.push(`/hop-new?investigationId=${investigationId}&causalFactorId=${factor.id}&assessmentId=${assessment.id}`)}
          className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
        >
          View/Edit
        </button>
      </div>
    </div>
  ))}

  <button
    onClick={() => router.push(`/hop-new?investigationId=${investigationId}&causalFactorId=${factor.id}`)}
    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm mt-2"
  >
    <Plus className="w-4 h-4" />
    {hopAssessments[factor.id]?.length > 0 ? 'Add Another HOP Assessment' : 'Launch HOP Assessment'}
  </button>
</div>

{/* HFAT Assessment Section - similar pattern */}
<div className="mt-3 pt-3 border-t">
  <div className="flex items-center justify-between mb-2">
    <h4 className="font-medium text-sm">HFAT Assessment</h4>
    {hfatAssessments[factor.id]?.length > 0 && (
      <span className="text-xs text-purple-600">
        {hfatAssessments[factor.id].length} assessment(s)
      </span>
    )}
  </div>

  {hfatAssessments[factor.id]?.map((assessment: any) => (
    <div key={assessment.id} className="mb-2 p-2 bg-purple-50 rounded border border-purple-200">
      <div className="flex items-center justify-between">
        <div className="text-xs">
          <div className="font-medium">HFAT Analysis</div>
          <div className="text-gray-600">
            {assessment.status === 'complete' ? 'Complete' : 'Draft'} - 
            {new Date(assessment.updated_at).toLocaleDateString()}
          </div>
        </div>
        <button
          onClick={() => router.push(`/hfat-new?investigationId=${investigationId}&causalFactorId=${factor.id}&assessmentId=${assessment.id}`)}
          className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          View/Edit
        </button>
      </div>
    </div>
  ))}

  <button
    onClick={() => router.push(`/hfat-new?investigationId=${investigationId}&causalFactorId=${factor.id}`)}
    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm mt-2"
  >
    <Plus className="w-4 h-4" />
    {hfatAssessments[factor.id]?.length > 0 ? 'Add Another HFAT Assessment' : 'Launch HFAT Assessment'}
  </button>
</div>
