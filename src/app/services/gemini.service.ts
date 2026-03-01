import { Injectable } from '@angular/core';
import { GoogleGenAI } from '@google/genai';

export interface GeminiResult {
  explanation: string;
  example: string;
  implementation: string;
  riskLevel: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {

  private ai = new GoogleGenAI({
    apiKey: 'AIzaSyCzNR4_evCezxizLS8EUmsuPPHyamVYE6o'
  });

  async getExplanation(requirementText: string): Promise<GeminiResult> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a senior application security expert specializing in OWASP standards. Analyze the following OWASP ASVS (Application Security Verification Standard) requirement and provide a comprehensive, professional explanation.

Return your answer in this EXACT format with no additional text before or after:

EXPLANATION:
<Write 2-3 sentences clearly explaining what this requirement means, why it is important for application security, and what problem it addresses. Use professional but accessible language.>

EXAMPLE:
<Provide a concrete, real-world practical example showing how this requirement would be implemented or violated in a typical web application. Include specific technical details.>

IMPLEMENTATION:
<Describe 2-3 specific steps or best practices a development team should follow to implement this requirement. Be specific and actionable.>

RISK_LEVEL:
<State exactly one of: Critical | High | Medium | Low — based on the security impact if this requirement is not met.>

ASVS Requirement to analyze:
${requirementText}`
      });

      const result = response.text || '';

      const explanationMatch = result.match(/EXPLANATION:\s*([\s\S]*?)\s*EXAMPLE:/);
      const exampleMatch = result.match(/EXAMPLE:\s*([\s\S]*?)\s*IMPLEMENTATION:/);
      const implementationMatch = result.match(/IMPLEMENTATION:\s*([\s\S]*?)\s*RISK_LEVEL:/);
      const riskMatch = result.match(/RISK_LEVEL:\s*([\s\S]*?)$/);

      return {
        explanation: explanationMatch ? explanationMatch[1].trim() : 'Explanation not available.',
        example: exampleMatch ? exampleMatch[1].trim() : 'Example not available.',
        implementation: implementationMatch ? implementationMatch[1].trim() : 'Implementation details not available.',
        riskLevel: riskMatch ? riskMatch[1].trim().split('\n')[0].trim() : 'Medium'
      };

    } catch (error) {
      console.error('Gemini SDK error:', error);
      return {
        explanation: 'Unable to generate explanation. Please check your API key and try again.',
        example: '',
        implementation: '',
        riskLevel: 'Unknown'
      };
    }
  }
}
