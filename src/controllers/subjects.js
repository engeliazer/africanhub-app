export const createSubjectWithTopicSubtopic = async (req, res) => {
  try {
    // Extract data from the nested structure
    const { subject, topic, subtopic } = req.body;
    
    // Validate required fields
    if (!subject || !topic || !subtopic) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: subject, topic, or subtopic",
      });
    }

    // Validate subtopic has required fields
    if (!subtopic.name || !subtopic.code) {
      return res.status(400).json({
        success: false,
        message: "Subtopic must have name and code",
      });
    }

    // Create the subject with default values for missing fields
    const createdSubject = await Subject.create({
      name: subject.name || "Default Subject",
      description: subject.description || "Default description",
      courseId: subject.courseId || 1, // Default course ID
      current_price: subject.current_price || 0,
      created_by: subject.created_by || 1,
      updated_by: subject.updated_by || 1
    });

    // Create topic with default values for missing fields
    const createdTopic = await Topic.create({
      name: topic.name || "Default Topic",
      description: topic.description || "Default description",
      subjectId: createdSubject.id,
      created_by: topic.created_by || 1,
      updated_by: topic.updated_by || 1
    });

    // Create subtopic
    const createdSubtopic = await Subtopic.create({
      name: subtopic.name,
      description: subtopic.description || "",
      code: subtopic.code,
      is_active: subtopic.is_active !== undefined ? subtopic.is_active : true,
      topicId: createdTopic.id,
      created_by: subtopic.created_by || 1,
      updated_by: subtopic.updated_by || 1
    });

    // Fetch the created subject with its topic and subtopic
    const result = await Subject.findByPk(createdSubject.id, {
      include: [
        {
          model: Topic,
          include: [Subtopic],
        },
      ],
    });

    return res.status(201).json({
      success: true,
      data: result,
      message: "Subject created successfully with topic and subtopic",
    });
  } catch (error) {
    console.error("Error creating subject with topic and subtopic:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create subject with topic and subtopic",
      error: error.message,
    });
  }
}; 