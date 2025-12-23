
import { GoogleGenAI, Type } from "@google/genai";
import { PetName, Species } from "../types";

export const generatePetNames = async (species: Species): Promise<PetName[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Mapping species to Spanish for the prompt context, though the AI understands English keys too.
  const speciesEs = {
    'Dog': 'perro',
    'Cat': 'gato',
    'Hamster': 'hámster',
    'Bird': 'pájaro',
    'Rabbit': 'conejo',
    'Reptile': 'reptil',
    'Other': 'mascota'
  }[species] || species;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Genera una lista de 100 nombres diversos, populares y creativos para un ${speciesEs}. 
    IMPORTANTE: Todo el contenido debe estar en ESPAÑOL.
    Incluye el nombre, un 'meaning' (significado) corto y encantador o la razón de su popularidad, y 2-3 'tags' (etiquetas) que describan su estilo (ej: "tierno", "rudo", "clásico").`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          names: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                meaning: { type: Type.STRING, description: "Significado en español" },
                tags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING, description: "Etiqueta en español" }
                }
              },
              required: ["name", "meaning", "tags"]
            }
          }
        },
        required: ["names"]
      }
    }
  });

  const data = JSON.parse(response.text);
  return data.names.map((n: any, index: number) => ({
    ...n,
    id: `name-${index}-${Date.now()}`
  }));
};
