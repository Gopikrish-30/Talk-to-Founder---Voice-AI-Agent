from pathlib import Path
from retriever import LocalRetriever

def run_test():
    workspace_dir = Path(__file__).parent.parent
    kb_file = workspace_dir / "Manuver_Founder_Chatbot_Training.md"
    
    print(f"Loading retriever with file: {kb_file}")
    retriever = LocalRetriever(kb_file)
    
    print(f"Total chunks indexed: {len(retriever.chunks)}")
    for i, c in enumerate(retriever.chunks):
        print(f"  [{i}] Chunk: {c['title']} ({len(c['text'])} characters)")
        
    print("\n--- Test 1: Querying about founder ---")
    results = retriever.retrieve("who is the founder of Maneuver? What is Husain Topiwala's experience?", top_k=2)
    for r in results:
        print(f"-> Title: {r['title']}")
        print(f"   Snippet: {r['text'][:120]}...\n")
        
    print("\n--- Test 2: Querying about hospitality and case study ---")
    results = retriever.retrieve("do you have a case study on hotels or hospitality in Dubai?", top_k=1)
    for r in results:
        print(f"-> Title: {r['title']}")
        print(f"   Snippet: {r['text'][:120]}...\n")

    print("\n--- Test 3: Querying about pricing ---")
    results = retriever.retrieve("how much do your services cost? price list?", top_k=1)
    for r in results:
        print(f"-> Title: {r['title']}")
        print(f"   Snippet: {r['text'][:120]}...\n")

if __name__ == "__main__":
    run_test()
