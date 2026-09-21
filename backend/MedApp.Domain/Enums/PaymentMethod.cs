namespace MedApp.Domain.Enums;

public enum PaymentMethod
{
    Cash = 0,
    CreditCard = 1,
    DebitCard = 2,
    BankTransfer = 3,
    ElectronicWallet = 4 // SINPE, Zelle, Bizum, Yape, Plin, etc.
}
