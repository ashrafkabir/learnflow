/**
 * Exam Agent — generates quizzes, scores responses, identifies knowledge gaps.
 */
export class ExamAgent {
    name = 'exam_agent';
    capabilities = ['generate_quiz', 'score_quiz', 'identify_gaps'];
    async initialize() { }
    async process(_context, task) {
        const content = task.params.content || task.params.input || '';
        const questionType = task.params.questionType || 'multiple_choice';
        let data;
        let text;
        if (task.type === 'score_quiz') {
            const answers = task.params.answers;
            const questions = task.params.questions;
            data = this.scoreQuiz(questions, answers);
            text = `Quiz scored: ${data.percentage}% correct.`;
        }
        else if (questionType === 'short_answer') {
            data = this.generateShortAnswerQuestions(content);
            text = `Generated ${data.length} short-answer questions.`;
        }
        else {
            data = this.generateMultipleChoiceQuestions(content);
            text = `Generated ${data.length} multiple-choice questions.`;
        }
        return {
            agentName: this.name,
            status: 'success',
            data: { text, questions: data },
            tokensUsed: 150,
        };
    }
    async cleanup() { }
    generateMultipleChoiceQuestions(content) {
        const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 20);
        const questions = [];
        for (let i = 0; i < Math.min(sentences.length, 5); i++) {
            const sentence = sentences[i].trim();
            const words = sentence.split(' ').filter((w) => w.length > 3);
            const keyWord = words[Math.floor(words.length / 2)] || 'concept';
            questions.push({
                id: `mcq-${i}`,
                question: `What is true about ${keyWord}?`,
                options: [
                    sentence.slice(0, 50) + '...',
                    'This is incorrect option A',
                    'This is incorrect option B',
                    'This is incorrect option C',
                ],
                correctIndex: 0,
                explanation: sentence,
            });
        }
        return questions;
    }
    generateShortAnswerQuestions(content) {
        const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 20);
        const questions = [];
        for (let i = 0; i < Math.min(sentences.length, 5); i++) {
            const sentence = sentences[i].trim();
            const words = sentence.split(' ').filter((w) => w.length > 4);
            questions.push({
                id: `sa-${i}`,
                question: `Explain the concept mentioned: "${words.slice(0, 3).join(' ')}"`,
                expectedKeywords: words.slice(0, 5),
                sampleAnswer: sentence,
            });
        }
        return questions;
    }
    scoreQuiz(questions, answers) {
        let correct = 0;
        const correctAnswers = [];
        const incorrectAnswers = [];
        const knowledgeGaps = [];
        for (const q of questions) {
            const userAnswer = parseInt(answers[q.id] || '-1', 10);
            if (userAnswer === q.correctIndex) {
                correct++;
                correctAnswers.push(q.id);
            }
            else {
                incorrectAnswers.push(q.id);
                knowledgeGaps.push(q.question);
            }
        }
        return {
            score: correct,
            total: questions.length,
            percentage: questions.length > 0 ? (correct / questions.length) * 100 : 0,
            knowledgeGaps,
            correctAnswers,
            incorrectAnswers,
        };
    }
}
//# sourceMappingURL=exam-agent.js.map