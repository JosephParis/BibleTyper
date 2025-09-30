    import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

interface Verse {
  id: number;
  text: string;
  reference: string;
  translation: string;
}

const VerseContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background-color: #f5f5f5;
`;

const VerseCard = styled.div`
  background-color: white;
  padding: 2rem;
  margin: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  max-width: 800px;
  width: 100%;
  text-align: center;
`;

const VerseText = styled.p`
  font-size: 1.5rem;
  line-height: 1.6;
  margin-bottom: 1rem;
  font-weight: 500;
`;

const VerseReference = styled.p`
  font-size: 1rem;
  color: #666;
  font-style: italic;
`;

const VerseDisplay: React.FC = () => {
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVerses = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/verses/random?count=5');
      const data = await response.json();
      setVerses(data);
    } catch (error) {
      console.error('Error fetching verses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerses();
  }, []);

  if (loading) {
    return (
      <VerseContainer>
        <p>Loading verses...</p>
      </VerseContainer>
    );
  }

  return (
    <VerseContainer>
      {verses.map((verse) => (
        <VerseCard key={verse.id}>
          <VerseText>{verse.text}</VerseText>
          <VerseReference>{verse.reference} - {verse.translation}</VerseReference>
        </VerseCard>
      ))}
    </VerseContainer>
  );
};

export default VerseDisplay; 