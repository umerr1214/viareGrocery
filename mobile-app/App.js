import React, { useState } from 'react';
import { SafeAreaView, TextInput, Button, FlatList, Text, StyleSheet } from 'react-native';

export default function App() {
  const [item, setItem] = useState('');
  const [list, setList] = useState([]);
  const [instructions, setInstructions] = useState([]);

  const addItem = () => {
    if (item.trim()) {
      setList([...list, item.trim()]);
      setItem('');
    }
  };

  const fetchPath = async () => {
    try {
      const response = await fetch('http://192.168.0.90:3001/api/path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: list }),
      });
      const data = await response.json();
      setInstructions(data.instructions);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch path. Make sure backend is running and device is on same Wi-Fi.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>🛒 Grocery Navigator</Text>
      <TextInput
        placeholder="Enter grocery item"
        value={item}
        onChangeText={setItem}
        style={styles.input}
      />
      <Button title="Add Item" onPress={addItem} />
      <FlatList
        data={list}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => <Text style={styles.item}>{item}</Text>}
      />
      <Button title="Get Navigation Path" onPress={fetchPath} />
      <Text style={styles.title}>🗺️ Instructions:</Text>
      <FlatList
        data={instructions}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => <Text style={styles.instruction}>{item}</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, marginTop: 40, padding: 20, backgroundColor: '#fff' },
  heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 },
  item: { fontSize: 16, paddingVertical: 4 },
  title: { fontSize: 18, fontWeight: 'bold', marginTop: 20 },
  instruction: { fontSize: 16, paddingVertical: 4, color: 'green' },
});
