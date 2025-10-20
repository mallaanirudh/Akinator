// utils/questionMapper.js
export function formatQuestionForUser(trait) {
  // Convert any trait type to a Yes/No question for the user
  const questionTemplates = {
    'BOOLEAN': `Does your character have ${trait.displayName}?`,
    'ENUM': `Is your character ${trait.displayName}?`,
    'STRING': `Is your character associated with ${trait.displayName}?`
  };
  
  return {
    id: trait.id,
    text: questionTemplates[trait.type] || `Is your character ${trait.displayName}?`,
    type: trait.type, 
    trait: trait
  };
}

