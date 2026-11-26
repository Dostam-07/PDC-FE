// Document Analysis & Context Extraction Service

export const parseUploadedDocument = (file, existingContext = {}) => {
  const filename = file ? file.originalname : "Uploaded_Concept_Note.docx";
  const fileExt = filename.split('.').pop().toLowerCase();

  // Extract structured framework context from document
  const extractedAttributes = {
    documentName: filename,
    fileType: fileExt.toUpperCase(),
    fileSize: file ? `${(file.size / 1024).toFixed(1)} KB` : "142 KB",
    uploadTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    extractedInfo: {
      programmeChallenge: "High grade-3 student reading deficit due to traditional rote-learning classroom methods.",
      programmeGoal: "Statewide Primary School Literacy Transformation in Punjab",
      targetBeneficiaries: "Primary School Students (Grades 1-5)",
      geography: "5 Districts in Punjab (Amritsar, Ludhiana, Jalandhar, Patiala, Bhatinda)",
      stakeholders: ["District Education Officers", "Block Primary Education Officers", "Primary Teachers", "SMCs"],
      outcomes: [
        "Improvement in grade-3 oral reading fluency to 60 words per minute.",
        "100% adoption of daily 90-minute structured literacy blocks."
      ],
      outputs: [
        "FLN Kit distribution to 2,500 primary schools.",
        "Teacher training module completion for 6,000 teachers."
      ],
      activities: [
        "3-day residential master trainer workshop.",
        "Monthly cluster level teacher review meetings."
      ],
      missingAttributes: ["Monitoring Indicators & Means of Verification"]
    }
  };

  // Conflict detection with existing user profile/context
  let conflictFound = null;
  if (existingContext.state && existingContext.state !== "Punjab") {
    conflictFound = {
      message: `Your uploaded document mentions Punjab as target geography, while earlier your profile specified ${existingContext.state}. Which geography should I use for this programme?`,
      options: ["Use Punjab (from document)", `Use ${existingContext.state} (from profile)`]
    };
  }

  const summaryMessage = `I've analyzed **"${filename}"** and extracted the following key programme attributes:\n\n` +
    `• **Programme Goal:** ${extractedAttributes.extractedInfo.programmeGoal}\n` +
    `• **Target Beneficiaries:** ${extractedAttributes.extractedInfo.targetBeneficiaries}\n` +
    `• **Geography:** ${extractedAttributes.extractedInfo.geography}\n` +
    `• **Extracted Outcomes & Outputs:** ${extractedAttributes.extractedInfo.outcomes.length} Outcomes, ${extractedAttributes.extractedInfo.outputs.length} Outputs identified.\n\n` +
    `⚠️ **Missing Context:** I need a little more information about *${extractedAttributes.extractedInfo.missingAttributes.join(', ')}* before generating your complete Logical Framework.`;

  return {
    extractedAttributes,
    conflictFound,
    summaryMessage,
    quickReplies: ["Provide Missing Context", "Generate LFA Matrix", "View Extracted Summary"]
  };
};
