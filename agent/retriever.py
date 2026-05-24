import re
import math
from pathlib import Path
from typing import List, Dict, Tuple, Any

class LocalRetriever:
    STOP_WORDS = {
        'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', "you're", "you've", "you'll", "you'd",
        'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', "she's", 'her', 'hers',
        'herself', 'it', "it's", 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which',
        'who', 'whom', 'this', 'that', "that'll", 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been',
        'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if',
        'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
        'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out',
        'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
        'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
        'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', "don't", 'should',
        "should've", 'now', 'd', 'll', 'm', 'o', 're', 've', 'y', 'ain', 'aren', "aren't", 'couldn', "couldn't",
        'didn', "didn't", 'doesn', "doesn't", 'hadn', "hadn't", 'hasn', "hasn't", 'haven', "haven't", 'isn', "isn't",
        'ma', 'mightn', "mightn't", 'mustn', "mustn't", 'needn', "needn't", 'shan', "shan't", 'shouldn', "shouldn't",
        'wasn', "wasn't", 'weren', "weren't", 'won', "won't", 'wouldn', "wouldn't"
    }

    def __init__(self, filepath: Path):
        self.filepath = filepath
        self.chunks: List[Dict[str, Any]] = []
        self.vocab: Dict[str, int] = {}
        self.idf: Dict[str, float] = {}
        self.chunk_vectors: List[Dict[int, float]] = []
        
        self._load_and_index()

    def _tokenize(self, text: str) -> List[str]:
        # Lowercase, clean punctuation, split into words
        words = re.findall(r'\b\w{2,}\b', text.lower())
        # Filter stop words
        return [w for w in words if w not in self.STOP_WORDS]

    def _load_and_index(self):
        if not self.filepath.exists():
            print(f"Warning: File {self.filepath} not found for indexing.")
            return

        with open(self.filepath, "r", encoding="utf-8") as f:
            content = f.read()

        # Split markdown into chunks based on H2 (##) and H3 (###) headers
        raw_sections = re.split(r'\n(?:##|###)\s+', content)
        
        # Handle the intro section (before the first header)
        intro = raw_sections[0].strip()
        if intro:
            self.chunks.append({
                "title": "Introduction",
                "text": intro
            })

        for section in raw_sections[1:]:
            lines = section.split('\n')
            title = lines[0].strip()
            text = '\n'.join(lines[1:]).strip()
            if not text:
                continue

            # Sub-split Q&A if this is a Q&A section
            if "Common Questions" in title or "Q&A" in title or "FAQ" in title:
                # Split by '**Q:'
                qas = re.split(r'\n\*\*Q:\s*', '\n' + text)
                for qa in qas:
                    qa = qa.strip()
                    if not qa:
                        continue
                    # qa looks like: "How much does it cost?**\nA: ..."
                    qa_parts = qa.split('**', 1)
                    if len(qa_parts) == 2:
                        q_text = qa_parts[0].strip()
                        a_text = qa_parts[1].strip()
                        if a_text.startswith(':'):
                            a_text = a_text[1:].strip()
                        self.chunks.append({
                            "title": f"Q: {q_text}",
                            "text": f"Question: {q_text}\nAnswer: {a_text}"
                        })
                    else:
                        self.chunks.append({
                            "title": f"Q&A: {title}",
                            "text": qa
                        })
            else:
                self.chunks.append({
                    "title": title,
                    "text": f"Section: {title}\n\n{text}"
                })

        # Calculate TF-IDF for all chunks
        num_docs = len(self.chunks)
        if num_docs == 0:
            return

        # 1. Build vocabulary and calculate Doc Frequency (DF)
        doc_freqs: Dict[str, int] = {}
        tfs_per_doc: List[Dict[str, int]] = []

        for chunk in self.chunks:
            tokens = self._tokenize(chunk["text"])
            tf: Dict[str, int] = {}
            for token in tokens:
                tf[token] = tf.get(token, 0) + 1
            tfs_per_doc.append(tf)

            # Update doc frequency
            for token in tf.keys():
                doc_freqs[token] = doc_freqs.get(token, 0) + 1

        # 2. Build vocab mapping
        self.vocab = {word: idx for idx, word in enumerate(doc_freqs.keys())}

        # 3. Calculate IDF
        for word, df in doc_freqs.items():
            # Standard IDF formula with smoothing
            self.idf[word] = math.log((num_docs + 1) / (df + 0.5)) + 1

        # 4. Create document vectors (TF-IDF)
        for tf in tfs_per_doc:
            vector: Dict[int, float] = {}
            squared_sum = 0.0
            
            for word, count in tf.items():
                vocab_idx = self.vocab[word]
                # Log-frequency weighting for TF
                tf_val = 1 + math.log(count)
                tfidf_val = tf_val * self.idf[word]
                vector[vocab_idx] = tfidf_val
                squared_sum += tfidf_val ** 2
            
            # Normalize vector (L2 norm) to handle varying chunk lengths
            norm = math.sqrt(squared_sum) if squared_sum > 0 else 1.0
            normalized_vector = {k: v / norm for k, v in vector.items()}
            self.chunk_vectors.append(normalized_vector)

    def retrieve(self, query: str, top_k: int = 2) -> List[Dict[str, Any]]:
        if not self.chunks or not query:
            return []

        query_tokens = self._tokenize(query)
        query_tf: Dict[str, int] = {}
        for token in query_tokens:
            if token in self.vocab:
                query_tf[token] = query_tf.get(token, 0) + 1

        if not query_tf:
            # No query words are in the vocabulary, return empty list
            return []

        # Calculate TF-IDF vector for query
        query_vector: Dict[int, float] = {}
        squared_sum = 0.0
        for word, count in query_tf.items():
            vocab_idx = self.vocab[word]
            tf_val = 1 + math.log(count)
            tfidf_val = tf_val * self.idf[word]
            query_vector[vocab_idx] = tfidf_val
            squared_sum += tfidf_val ** 2

        query_norm = math.sqrt(squared_sum) if squared_sum > 0 else 1.0
        normalized_query_vector = {k: v / query_norm for k, v in query_vector.items()}

        # Compute cosine similarity with all doc vectors + title boosting
        scores: List[Tuple[int, float]] = []
        for doc_idx, doc_vector in enumerate(self.chunk_vectors):
            dot_product = 0.0
            # Sparse dot product
            for vocab_idx, q_val in normalized_query_vector.items():
                if vocab_idx in doc_vector:
                    dot_product += q_val * doc_vector[vocab_idx]
            
            # Title Boost: if query terms appear in the title, boost this chunk
            title_tokens = self._tokenize(self.chunks[doc_idx]["title"])
            title_matches = sum(1 for token in query_tokens if token in title_tokens)
            
            # Multiply score by a boost factor based on matches
            boost = 1.0 + (title_matches * 2.0)
            final_score = dot_product * boost
            
            scores.append((doc_idx, final_score))

        # Sort by similarity score descending
        scores.sort(key=lambda x: x[1], reverse=True)

        results = []
        for doc_idx, score in scores[:top_k]:
            results.append(self.chunks[doc_idx])
            
        return results
