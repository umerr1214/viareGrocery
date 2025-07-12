
const RecommendScreen = ({ route, navigation }) => {

    return (
        <>
        </>
    );
};

export default RecommendScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
        paddingTop: 50,
        paddingHorizontal: 20
    },
    heading: {
        paddingTop: 50,
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 16
    },
    instruction: {
        fontSize: 16,
        paddingVertical: 6,
        color: '#111827'
    },
    menuButton: {
        position: 'absolute',
        top: 40,
        left: 20,
        zIndex: 10
    },
    menuIcon: {
        fontSize: 26,
        color: '#0d9488'
    },
    menu: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 200,
        height: '100%',
        backgroundColor: '#e0f7f5',
        paddingTop: 80,
        paddingHorizontal: 20,
        zIndex: 9
    },
    menuItem: {
        marginVertical: 12
    },
    menuText: {
        fontSize: 16,
        color: '#0d9488',
        fontWeight: '600'
    }
});
